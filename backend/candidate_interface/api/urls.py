from api.views import InterviewSessionView
from django.urls import path

urlpatterns = [
    path(
        "<uuid:unique_link>/",
        InterviewSessionView.as_view(),
        name="api_interview_session",
    ),
]
