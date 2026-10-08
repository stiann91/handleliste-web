from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('liste', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='handleliste',
            name='turer',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
