import json
from datetime import datetime, timedelta

from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_safe

from .barcode import slå_opp_strekkode
from .models import Besok, Handleliste

MAKS_ELEMENTER = 300
MAKS_TEKST = 200
MAKS_TURER = 5
MAKS_LOGG = 30


def _enhet_id(request):
    eid = (request.headers.get("X-Enhet-ID") or "").strip()
    return eid if 0 < len(eid) <= 64 else None


def _registrer_besok(request):
    eid = _enhet_id(request)
    if eid:
        Besok.objects.update_or_create(enhet=eid, defaults={"sist_sett": timezone.now()})


def _aktive_siste_dogn():
    return Besok.objects.filter(sist_sett__gte=timezone.now() - timedelta(hours=24)).count()


def _reaktiver(lid):
    """Setter sist_sett til nå, og fjerner arkivert-merket hvis listen besøkes igjen."""
    Handleliste.objects.filter(pk=lid).update(sist_sett=timezone.now(), arkivert=False, arkivert_at=None)


def _rens_item(i):
    if not isinstance(i, dict):
        raise ValueError("Vare må være et objekt")
    qty = i.get("qty", 1)
    if not isinstance(qty, int) or not 1 <= qty <= 999:
        qty = 1
    return {
        "name": str(i.get("name") or "")[:MAKS_TEKST],
        "icon": str(i.get("icon") or "")[:20],
        "category": str(i.get("category") or "")[:50],
        "qty": qty,
        "plukket": bool(i.get("plukket")),
    }


def _rens_tur(t):
    if not isinstance(t, dict):
        raise ValueError("Tur må være et objekt")
    varer = t.get("items")
    if not isinstance(varer, list) or len(varer) > MAKS_ELEMENTER:
        raise ValueError("Ugyldige varer i tur")
    return {
        "dato": str(t.get("dato") or "")[:40],
        "items": [_rens_item(v) for v in varer],
    }


def _rens_logg_oppføring(e):
    if not isinstance(e, dict):
        raise ValueError("Loggoppføring må være et objekt")
    return {
        "navn": str(e.get("navn") or "")[:40],
        "enhet": str(e.get("enhet") or "")[:20],
        "vare": str(e.get("vare") or "")[:200],
        "tid": str(e.get("tid") or "")[:40],
    }


def _rens_dato(verdi):
    """Tar imot 'yyyy-mm-dd' (slik <input type=date> sender det) og returnerer en date,
    eller None hvis verdien mangler/er ugyldig."""
    if not isinstance(verdi, str) or not verdi:
        return None
    try:
        return datetime.strptime(verdi, "%Y-%m-%d").date()
    except ValueError:
        return None


def _og_tittel(liste):
    """Teksten som vises som tittel når lenken deles, f.eks. i Facebook/iMessage."""
    dato = liste.dato or liste.opprettet.date()
    dato_str = dato.strftime("%d/%m/%Y")
    if liste.tittel:
        return f"Handleliste for {liste.tittel} ({dato_str})"
    return f"Handleliste ({dato_str})"


def om(request):
    return render(request, "liste/om.html")


def landing(request):
    return render(request, "liste/landing.html")


@require_GET
def statistikk(request):
    return JsonResponse({
        "aktive_enheter": _aktive_siste_dogn(),
        "aktive_lister": Handleliste.objects.filter(arkivert=False).count(),
        "arkiverte_lister": Handleliste.objects.filter(arkivert=True).count(),
    })


@require_POST
def ny_liste(request):
    liste = Handleliste.objects.create(dato=timezone.now().date())
    return redirect("side", lid=liste.id)


@ensure_csrf_cookie
@require_safe
def side(request, lid):
    liste = Handleliste.objects.filter(pk=lid).first()
    if liste is None:
        return render(request, "liste/finnes_ikke.html", {"lid": lid}, status=404)
    _reaktiver(lid)
    _registrer_besok(request)
    dato = liste.dato or liste.opprettet.date()
    return render(request, "liste/side.html", {
        "lid": lid,
        "tittel": liste.tittel,
        "dato_iso": dato.isoformat(),
        "og_tittel": _og_tittel(liste),
    })


@require_GET
def liste_hent(request, lid):
    liste = Handleliste.objects.filter(pk=lid).first()
    if liste is None:
        return JsonResponse({"error": "Finnes ikke"}, status=404)
    _reaktiver(lid)
    _registrer_besok(request)
    dato = liste.dato or liste.opprettet.date()
    return JsonResponse({
        "items": liste.items, "history": liste.history, "turer": liste.turer, "logg": liste.logg,
        "tittel": liste.tittel, "dato": dato.isoformat(),
    })


@require_POST
def liste_lagre(request, lid):
    if not Handleliste.objects.filter(pk=lid).exists():
        return JsonResponse({"error": "Finnes ikke"}, status=404)
    try:
        payload = json.loads(request.body.decode("utf-8"))
        items = payload.get("items")
        history = payload.get("history")
        turer = payload.get("turer", [])
        logg = payload.get("logg", [])
        tittel = payload.get("tittel", "")
        dato = _rens_dato(payload.get("dato"))
        if not isinstance(items, list) or not isinstance(history, list):
            raise ValueError("items og history må være lister")
        if not isinstance(turer, list) or len(turer) > MAKS_TURER:
            raise ValueError("For mange turer")
        if not isinstance(logg, list) or len(logg) > MAKS_LOGG:
            raise ValueError("For mange loggoppføringer")
        if len(items) > MAKS_ELEMENTER or len(history) > MAKS_ELEMENTER:
            raise ValueError("For mange elementer")
        items = [_rens_item(i) for i in items]
        history = [str(h)[:MAKS_TEKST] for h in history]
        turer = [_rens_tur(t) for t in turer]
        logg = [_rens_logg_oppføring(e) for e in logg][:MAKS_LOGG]
        tittel = str(tittel or "")[:100]
    except (ValueError, UnicodeDecodeError, AttributeError):
        return JsonResponse({"error": "Ugyldig innhold"}, status=400)

    nå = timezone.now()
    Handleliste.objects.filter(pk=lid).update(
        items=items, history=history, turer=turer, logg=logg, tittel=tittel, dato=dato, oppdatert=nå, sist_sett=nå,
        arkivert=False, arkivert_at=None,
    )
    _registrer_besok(request)
    return JsonResponse({"ok": True})


@require_GET
def barcode_lookup(request, kode):
    resultat = slå_opp_strekkode(kode)
    if resultat is None:
        return JsonResponse({"funnet": False}, status=404)
    return JsonResponse({"funnet": True, **resultat})


@require_GET
def robots_txt(request):
    """Blokkerer individuelle handlelister fra indeksering i søkemotorer (de er
    private og unike per bruker), men gir sosiale medie-crawlere et eksplisitt
    unntak slik at lenke-forhåndsvisninger (Facebook/Messenger, Twitter/X,
    LinkedIn, Slack) fortsatt kan lese Open Graph-taggene."""
    linjer = [
        "User-agent: facebookexternalhit",
        "Allow: /",
        "",
        "User-agent: Facebot",
        "Allow: /",
        "",
        "User-agent: Twitterbot",
        "Allow: /",
        "",
        "User-agent: LinkedInBot",
        "Allow: /",
        "",
        "User-agent: Slackbot",
        "Allow: /",
        "",
        "User-agent: WhatsApp",
        "Allow: /",
        "",
        "User-agent: TelegramBot",
        "Allow: /",
        "",
        "User-agent: Discordbot",
        "Allow: /",
        "",
        "User-agent: SkypeUriPreview",
        "Allow: /",
        "",
        "User-agent: *",
        "Allow: /$",
        "Allow: /om/$",
        "Disallow: /liste/",
        "",
        "Sitemap: https://handleliste.ginasbakeri.no/sitemap.xml",
    ]
    return HttpResponse("\n".join(linjer), content_type="text/plain")
