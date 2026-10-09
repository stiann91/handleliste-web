import uuid

from django.db import models
from django.utils import timezone


class Handleliste(models.Model):
    """En delt handleliste. Den som har lenken (UUID-en), kan lese og endre den."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    items = models.JSONField(default=list, blank=True)
    history = models.JSONField(default=list, blank=True)
    turer = models.JSONField(default=list, blank=True)
    opprettet = models.DateTimeField(default=timezone.now)
    oppdatert = models.DateTimeField(default=timezone.now)
    sist_sett = models.DateTimeField(default=timezone.now, db_index=True)
    arkivert = models.BooleanField(default=False, db_index=True)
    arkivert_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Handleliste {self.id} ({len(self.items)} varer)"


class Besok(models.Model):
    """Anonym enhets-ID (tilfeldig, lagret i enhetens localStorage). Ingen IP-adresse lagres."""
    enhet = models.CharField(max_length=64, unique=True)
    sist_sett = models.DateTimeField(default=timezone.now, db_index=True)

    def __str__(self):
        return f"{self.enhet[:8]}… sist {self.sist_sett:%Y-%m-%d %H:%M}"


class Produkt(models.Model):
    """Cache for strekkodeoppslag, også for varer som ikke finnes (funnet=False)."""
    kode = models.CharField(max_length=20, unique=True)
    navn = models.CharField(max_length=200, blank=True)
    merke = models.CharField(max_length=200, blank=True)
    funnet = models.BooleanField(default=False)
    oppslag_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.navn or self.kode
