from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from liste.models import Besok, Handleliste


class Command(BaseCommand):
    help = "Sletter lister som ikke er brukt på en stund, og gamle besøksregistreringer."

    def add_arguments(self, parser):
        parser.add_argument("--dager", type=int, default=7, help="Slett lister inaktive i så mange dager")

    def handle(self, *args, **opts):
        nå = timezone.now()
        lister, _ = Handleliste.objects.filter(sist_sett__lt=nå - timedelta(days=opts["dager"])).delete()
        besok, _ = Besok.objects.filter(sist_sett__lt=nå - timedelta(days=2)).delete()
        self.stdout.write(f"Slettet {lister} objekter knyttet til lister og {besok} besøk")
