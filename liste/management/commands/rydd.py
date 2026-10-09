from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from liste.models import Besok, Handleliste


class Command(BaseCommand):
    help = (
        "Arkiverer lister som ikke er brukt på en stund, sletter lister som har vært "
        "arkivert lenge, og rydder gamle besøksregistreringer."
    )

    def add_arguments(self, parser):
        parser.add_argument("--arkiver-etter", type=int, default=7, help="Arkiver lister inaktive i så mange dager")
        parser.add_argument("--slett-etter", type=int, default=7, help="Slett lister som har vært arkivert så mange dager")

    def handle(self, *args, **opts):
        nå = timezone.now()

        arkivert = Handleliste.objects.filter(
            arkivert=False,
            sist_sett__lt=nå - timedelta(days=opts["arkiver_etter"]),
        ).update(arkivert=True, arkivert_at=nå)

        lister, _ = Handleliste.objects.filter(
            arkivert=True,
            arkivert_at__lt=nå - timedelta(days=opts["slett_etter"]),
        ).delete()

        besok, _ = Besok.objects.filter(sist_sett__lt=nå - timedelta(days=2)).delete()

        self.stdout.write(
            f"Arkiverte {arkivert} lister, slettet {lister} lister og {besok} besøk"
        )
