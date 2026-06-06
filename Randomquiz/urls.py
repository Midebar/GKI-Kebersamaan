from django.urls import path

from . import views

app_name = 'Randomquiz'

urlpatterns = [
    path('', views.quiz_home, name='quiz_home'),
    path('image/', views.quiz_image, name='quiz_image'),
    path('bible/', views.quiz_bible, name='quiz_bible'),
    path('music/', views.quiz_music, name='quiz_music'),
    path('wordle/', views.quiz_wordle, name='quiz_wordle'),
    # APIs
    path('api/image/', views.api_image, name='api_image'),
    path('api/chapter/', views.api_chapter, name='api_chapter'),
    path('api/wordle/', views.api_wordle, name='api_wordle'),
    path('api/wordle/check/', views.api_wordle_check, name='api_wordle_check'),
    path('api/music/', views.api_music, name='api_music'),
    path('api/teams/', views.api_get_teams, name='api_get_teams'),
    path('api/award-points/', views.api_award_points, name='api_award_points'),
]
