from django.contrib import admin
from .models import QuizMode, ImageGuess, ChapterGuess, WordleQuiz, MusicGuess, Team

# Customizing how the lists look in the admin panel
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'score', 'is_active')
    list_editable = ('score', 'is_active') # Allows you to edit scores directly from the list view

@admin.register(ImageGuess)
class ImageGuessAdmin(admin.ModelAdmin):
    list_display = ('answer', 'quiz_mode')

@admin.register(ChapterGuess)
class ChapterGuessAdmin(admin.ModelAdmin):
    list_display = ('chapter_title', 'verse_reference', 'quiz_mode')

@admin.register(WordleQuiz)
class WordleQuizAdmin(admin.ModelAdmin):
    list_display = ('target_word', 'max_attempts', 'quiz_mode')

@admin.register(MusicGuess)
class MusicGuessAdmin(admin.ModelAdmin):
    list_display = ('song_title', 'artist', 'quiz_mode')

@admin.register(QuizMode)
class QuizModeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')