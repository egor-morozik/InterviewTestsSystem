from django.urls import path
from . import views

app_name = 'candidate_interface'

urlpatterns = [
    path('test/<uuid:unique_link>/', views.take_test, name='take_test'),
]
