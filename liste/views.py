import json
from datetime import timedelta

from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .barcode import slå_opp_strekkode
from .models import Besok, Handleliste

MAKS_ELEMENTER = 300
MAKS_TEKST = 200


def _enhet_id(request):
    eid = (request.headers.get("X-Enhet-ID") or "").strip()
    return eid if 0 < len(eid) <= 64 else None


def _registrer_besok(request):
    eid = _enhet_id(request)
    if eid:
        Besok.objects.update_or_create(enhet=eid, defaults={"sist_sett": timezone.now()})


def _aktive_siste_dogn():
    return Besok.objects.filter(sist_sett__gte=timezone.now() - timedelta(hours=24)).count()


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
    }


def landing(request):
    return render(request, "liste/landing.html", {"aktive_siste_dogn": _aktive_siste_dogn()})


@require_POST
def ny_liste(request):
    liste = Handleliste.objects.create()
    return redirect("side", lid=liste.id)


@ensure_csrf_cookie
@require_GET
def side(request, lid):
    if not Handleliste.objects.filter(pk=lid).exists():
        return render(request, "liste/finnes_ikke.html", status=404)
    Handleliste.objects.filter(pk=lid).update(sist_sett=timezone.now())
    _registrer_besok(request)
    return render(request, "liste/side.html", {"lid": lid, "aktive_siste_dogn": _aktive_siste_dogn()})


@require_GET
def liste_hent(request, lid):
    liste = Handleliste.objects.filter(pk=lid).first()
    if liste is None:
        return JsonResponse({"error": "Finnes ikke"}, status=404)
    Handleliste.objects.filter(pk=lid).update(sist_sett=timezone.now())
    _registrer_besok(request)
    return JsonResponse({"items": liste.items, "history": liste.history})


@require_POST
def liste_lagre(request, lid):
    if not Handleliste.objects.filter(pk=lid).exists():
        return JsonResponse({"error": "Finnes ikke"}, status=404)
    try:
        payload = json.loads(request.body.decode("utf-8"))
        items = payload.get("items")
        history = payload.get("history")
        if not isinstance(items, list) or not isinstance(history, list):
            raise ValueError("items og history må være lister")
        if len(items) > MAKS_ELEMENTER or len(history) > MAKS_ELEMENTER:
            raise ValueError("For mange elementer")
        items = [_rens_item(i) for i in items]
        history = [str(h)[:MAKS_TEKST] for h in history]
    except (ValueError, UnicodeDecodeError, AttributeError):
        return JsonResponse({"error": "Ugyldig innhold"}, status=400)

    nå = timezone.now()
    Handleliste.objects.filter(pk=lid).update(items=items, history=history, oppdatert=nå, sist_sett=nå)
    _registrer_besok(request)
    return JsonResponse({"ok": True})


@require_GET
def barcode_lookup(request, kode):
    resultat = slå_opp_strekkode(kode)
    if resultat is None:
        return JsonResponse({"funnet": False}, status=404)
    return JsonResponse({"funnet": True, **resultat})

def om(request):
    return render(request, "liste/om.html")
