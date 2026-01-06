from django.urls import path

from .views import TestTemplateDetailView, TestTemplateListView

urlpatterns = [
    path(
        "templates/",
        TestTemplateListView.as_view(),
        name="template_list",
    ),
    path(
        "templates/<int:pk>/", TestTemplateDetailView.as_view(), name="template_detail"
    ),
]
