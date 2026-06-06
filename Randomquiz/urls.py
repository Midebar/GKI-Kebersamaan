from django.urls import path

from . import views

app_name = 'Randomquiz'

urlpatterns = [
    path('', views.quiz_home, name='quiz_home'),
    path('image/', views.quiz_image, name='quiz_image'),
    path('bible/', views.quiz_bible, name='quiz_bible'),
    path('music/', views.quiz_music, name='quiz_music'),
    path('wordle/', views.quiz_wordle, name='quiz_wordle'),
]
