from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('liste', '0002_handleliste_turer'),
    ]

    operations = [
        migrations.AddField(
            model_name='handleliste',
            name='arkivert',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='handleliste',
            name='arkivert_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
