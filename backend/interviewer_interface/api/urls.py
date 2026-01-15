from django.urls import path

from .admin_views import (
    AdminDashboardView,
    CandidateListView,
    GenerateQuestionView,
    InvitationDetailView,
    InvitationListView,
    QuestionDetailView,
    QuestionListCreateView,
    TagListCreateView,
    TechLeadListView,
    UserListView,
    UserDetailView,
    TestTemplateAdminCreateView,
)
from .views import (
    TestTemplateDetailView,
    TestTemplateListView,
    CurrentUserView,
    LoginView,
)

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
    path("admin/questions/", QuestionListCreateView.as_view(), name="admin_questions"),
    path(
        "admin/questions/<int:pk>/",
        QuestionDetailView.as_view(),
        name="admin_question_detail",
    ),
    path("admin/tags/", TagListCreateView.as_view(), name="admin_tags"),
    path(
        "admin/templates/",
        TestTemplateAdminCreateView.as_view(),
        name="admin_template_create",
    ),
    path(
        "admin/generate-question/",
        GenerateQuestionView.as_view(),
        name="admin_generate_question",
    ),
    path("admin/users/", UserListView.as_view(), name="admin_users"),
    path("admin/users/<int:pk>/", UserDetailView.as_view(), name="admin_user_detail"),
    path(
        "me/",
        CurrentUserView.as_view(),
        name="current_user",
    ),
    # Authentication endpoints
    path("login/", LoginView.as_view(), name="login"),
]
