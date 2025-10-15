from django.urls import path
from . import views

urlpatterns = [
    path('message/', views.message_api, name='message_api'),
]

