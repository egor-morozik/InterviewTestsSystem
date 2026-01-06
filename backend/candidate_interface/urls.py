from django.urls import path

from . import views

app_name = "candidate_interface"

urlpatterns = [
    path(
        "test/<uuid:unique_link>/",
        views.take_test,
        name="take_test",
    ),
    path(
        "test/<uuid:unique_link>/<int:question_id>/",
        views.take_test,
        name="take_test",
    ),
    path(
        "test/<uuid:unique_link>/finish/",
        views.finish_test,
        name="finish_test",
    ),
    path(
        "log-switch/<uuid:unique_link>/",
        views.log_tab_switch,
        name="log_tab_switch",
    ),
    path(
        "test/<uuid:unique_link>/",
        views.technical_interview,
        name="technical_interview",
    ),
    path(
        "test/<uuid:unique_link>/<int:question_id>/",
        views.technical_interview,
        name="technical_interview",
    ),
]
