from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/candidate/", include("candidate_interface.urls")),
    path("api/interviewer/", include("candidate_interface.api.urls")),
]
