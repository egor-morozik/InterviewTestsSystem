from django.urls import path

from .admin_views import (
    AdminDashboardView,
    CandidateListView,
    InvitationDetailView,
    InvitationListView,
    TechLeadListView,
)
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
    # Admin API
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin_dashboard"),
    path("admin/candidates/", CandidateListView.as_view(), name="admin_candidates"),
    path("admin/invitations/", InvitationListView.as_view(), name="admin_invitations"),
    path(
        "admin/invitations/<int:pk>/",
        InvitationDetailView.as_view(),
        name="admin_invitation_detail",
    ),
    path("admin/tech-leads/", TechLeadListView.as_view(), name="admin_tech_leads"),
]
