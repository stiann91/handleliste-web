from django.contrib.sitemaps import Sitemap
from django.urls import reverse


class StatiskSitemap(Sitemap):
    """
    Sitemap for de statiske, offentlige sidene.
    Individuelle handlelister (liste/<uuid>/) skal IKKE med her,
    de er private og skal ikke dukke opp i Google.
    """
    priority = 0.8
    changefreq = "monthly"

    def items(self):
        # Bytt ut navnene under med de faktiske url name'ene
        # dere bruker i urls.py for landing.html og om.html.
        return ["landing", "om"]

    def location(self, item):
        return reverse(item)
