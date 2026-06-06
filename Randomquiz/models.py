from django.db import models

class QuizMode(models.Model):
    MODE_IMAGE = "image"
    MODE_CHAPTER = "chapter"
    MODE_WORDLE = "wordle"
    MODE_MUSIC = "music"

    MODE_CHOICES = [
        (MODE_IMAGE, "Image guessing"),
        (MODE_CHAPTER, "Chapter guessing"),
        (MODE_WORDLE, "Wordle"),
        (MODE_MUSIC, "Music guessing"),
    ]

    name = models.CharField(max_length=32, choices=MODE_CHOICES, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.get_name_display()


class ImageGuess(models.Model):
    quiz_mode = models.OneToOneField(QuizMode, on_delete=models.CASCADE, related_name="image_guess")
    image_url = models.URLField(blank=True)
    answer = models.CharField(max_length=255)

    def __str__(self):
        return f"ImageGuess: {self.answer}"


class ChapterGuess(models.Model):
    quiz_mode = models.OneToOneField(QuizMode, on_delete=models.CASCADE, related_name="chapter_guess")
    chapter_title = models.CharField(max_length=255)
    verse_reference = models.CharField(max_length=64)

    def __str__(self):
        return f"ChapterGuess: {self.chapter_title}"


class WordleQuiz(models.Model):
    quiz_mode = models.OneToOneField(QuizMode, on_delete=models.CASCADE, related_name="wordle_quiz")
    target_word = models.CharField(max_length=64)
    max_attempts = models.PositiveSmallIntegerField(default=6)

    def __str__(self):
        return f"WordleQuiz: {self.target_word}"


class MusicGuess(models.Model):
    quiz_mode = models.OneToOneField(QuizMode, on_delete=models.CASCADE, related_name="music_guess")
    song_title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255, blank=True)
    audio_url = models.URLField(blank=True)

    def __str__(self):
        return f"MusicGuess: {self.song_title}"
