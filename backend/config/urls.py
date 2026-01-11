from django.contrib import admin
from django.urls import include, path

from .views import CsrfTokenView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/csrf-token/", CsrfTokenView.as_view(), name="csrf_token"),
    path("api/candidate/", include("candidate_interface.api.urls")),
    path("api/interviewer/", include("interviewer_interface.api.urls")),
]
