from django.urls import path

from .views import (
    FinishTestView,
    InterviewSessionView,
    LogTabSwitchView,
    QuestionDetailView,
    SubmitAnswerView,
    TestSessionView,
)

urlpatterns = [
    path(
        "test/<uuid:unique_link>/session/",
        TestSessionView.as_view(),
        name="test_session",
    ),
    path(
        "test/<uuid:unique_link>/question/<int:question_id>/",
        QuestionDetailView.as_view(),
        name="question_detail",
    ),
    path(
        "test/<uuid:unique_link>/question/<int:question_id>/answer/",
        SubmitAnswerView.as_view(),
        name="submit_answer",
    ),
    path(
        "test/<uuid:unique_link>/finish/",
        FinishTestView.as_view(),
        name="finish_test",
    ),
    path(
        "log-switch/<uuid:unique_link>/",
        LogTabSwitchView.as_view(),
        name="log_tab_switch",
    ),
    path(
        "session/<uuid:unique_link>/",
        InterviewSessionView.as_view(),
        name="api_interview_session",
    ),
]
