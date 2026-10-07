import re
from datetime import timedelta

import requests
from django.utils import timezone

from .models import Produkt

OFF_URL = "https://world.openfoodfacts.org/api/v2/product/{kode}.json"
GTIN_RE = re.compile(r"\d{8}|\d{12,14}")  # EAN-8, UPC-A, EAN-13, GTIN-14
NEGATIV_CACHE = timedelta(days=7)  # Varer som ikke finnes, sjekkes på nytt etter 7 dager


def gtin_gyldig(kode: str) -> bool:
    """Sjekker GS1-kontrollsifferet (siste siffer) i EAN-8, UPC-A, EAN-13 og GTIN-14."""
    if not GTIN_RE.fullmatch(kode):
        return False
    data, kontroll = kode[:-1], int(kode[-1])
    n = len(data)
    # Vektes 3 og 1 annenhver gang, startende med 3 nærmest kontrollsifferet
    total = sum(int(siffer) * (3 if (n - i) % 2 == 1 else 1) for i, siffer in enumerate(data))
    return (10 - total % 10) % 10 == kontroll


def _alternativ_form(kode: str) -> str | None:
    """UPC-A skannes ofte som EAN-13 med ledende null, og Open Food Facts kan ha lagret den ene formen."""
    if len(kode) == 13 and kode.startswith("0"):
        return kode[1:]
    if len(kode) == 12:
        return "0" + kode
    return None


def _hent_fra_off(kode: str) -> dict | None:
    """Returnerer produktdata, None hvis varen ikke finnes. Kaster RequestException ved nettverksfeil."""
    r = requests.get(
        OFF_URL.format(kode=kode),
        timeout=5,
        headers={"User-Agent": "Handleliste/1.0 (kontakt@dinside.no)"},
    )
    r.raise_for_status()
    data = r.json()
    if data.get("status") != 1:
        return None
    return data["product"]


def _navn_og_merke(p: dict) -> tuple[str, str]:
    navn = (
        p.get("product_name_nb")
        or p.get("product_name_no")
        or p.get("product_name")
        or p.get("generic_name")
        or ""
    ).strip()
    merke = (p.get("brands") or "").split(",")[0].strip()
    return navn, merke


def slå_opp_strekkode(kode: str) -> dict | None:
    kode = (kode or "").strip()
    if not gtin_gyldig(kode):
        return None

    cached = Produkt.objects.filter(kode=kode).first()
    if cached:
        if cached.funnet:
            return {"kode": kode, "navn": cached.navn, "merke": cached.merke}
        if timezone.now() - cached.oppslag_at < NEGATIV_CACHE:
            return None

    navn, merke = "", ""
    try:
        for k in filter(None, [kode, _alternativ_form(kode)]):
            produkt = _hent_fra_off(k)
            if produkt:
                navn, merke = _navn_og_merke(produkt)
                if navn:
                    break
    except (requests.RequestException, ValueError):
        return None  # Nettverksfeil cachees ikke, så vi prøver igjen senere

    Produkt.objects.update_or_create(
        kode=kode,
        defaults={"navn": navn, "merke": merke, "funnet": bool(navn)},
    )
    return {"kode": kode, "navn": navn, "merke": merke} if navn else None
