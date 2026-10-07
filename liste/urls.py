from django.urls import path

from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("ny/", views.ny_liste, name="ny"),
    path("liste/<uuid:lid>/", views.side, name="side"),
    path("api/liste/<uuid:lid>/", views.liste_hent, name="liste-hent"),
    path("api/liste/<uuid:lid>/lagre/", views.liste_lagre, name="liste-lagre"),
    path("api/barcode/<str:kode>/", views.barcode_lookup, name="barcode"),
    path("om/", views.om, name="om"),
]
