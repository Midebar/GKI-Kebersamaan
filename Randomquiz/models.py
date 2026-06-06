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

class Team(models.Model):
    name = models.CharField(max_length=50, help_text="Contoh: Kelompok 1, Kelompok 2")
    score = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True, help_text="Centang untuk mengikutkan tim ini di ronde berjalan")

    def __str__(self):
        return f"{self.name} (Score: {self.score})"

class ImageGuess(models.Model):
    quiz_mode = models.ForeignKey(QuizMode, on_delete=models.CASCADE, related_name="image_guess")
    image_url = models.CharField(max_length=255, blank=True, help_text="Contoh: /static/images/gambar1.jpg")
    answer = models.CharField(max_length=255)
    
    # New fields required by views.py
    category = models.CharField(max_length=50, choices=[('person', 'Tokoh'), ('place', 'Tempat'), ('object', 'Benda')], default='object')
    hint_1 = models.CharField(max_length=255, blank=True)
    hint_2 = models.CharField(max_length=255, blank=True)
    hint_3 = models.CharField(max_length=255, blank=True)
    fun_fact = models.TextField(blank=True)
    distractors = models.TextField(blank=True, help_text="Pilihan salah, pisahkan dengan koma. Contoh: Daud, Musa, Abraham")

    def get_distractors_list(self):
        return [d.strip() for d in self.distractors.split(',')] if self.distractors else ["Pilihan Salah 1", "Pilihan Salah 2", "Pilihan Salah 3"]

    def __str__(self):
        return f"ImageGuess: {self.answer}"

class ChapterGuess(models.Model):
    quiz_mode = models.ForeignKey(QuizMode, on_delete=models.CASCADE, related_name="chapter_guess")
    chapter_title = models.CharField(max_length=255)
    
    # New fields required by views.py
    guess_type = models.CharField(max_length=50, choices=[('tokoh', 'Tebak Tokoh'), ('kitab', 'Tebak Kitab')], default='kitab')
    verse_text = models.TextField(blank=True)
    verse_reference = models.CharField(max_length=64, blank=True)
    answer = models.CharField(max_length=255, default="")
    hint_1 = models.CharField(max_length=255, blank=True)
    hint_2 = models.CharField(max_length=255, blank=True)
    fun_fact = models.TextField(blank=True)
    distractors = models.TextField(blank=True, help_text="Pilihan salah, pisahkan dengan koma.")

    def get_distractors_list(self):
        return [d.strip() for d in self.distractors.split(',')] if self.distractors else ["Pilihan Salah 1", "Pilihan Salah 2", "Pilihan Salah 3"]

    def __str__(self):
        return f"ChapterGuess: {self.chapter_title}"

class WordleQuiz(models.Model):
    quiz_mode = models.ForeignKey(QuizMode, on_delete=models.CASCADE, related_name="wordle_quiz")
    target_word = models.CharField(max_length=64)
    max_attempts = models.PositiveSmallIntegerField(default=6)
    
    # New fields required by views.py
    category = models.CharField(max_length=50, choices=[('tokoh', 'Tokoh'), ('tempat', 'Tempat'), ('umum', 'Umum')], default='umum')
    hint = models.CharField(max_length=255, blank=True)
    hint_2 = models.CharField(max_length=255, blank=True)
    fun_fact = models.TextField(blank=True)

    def get_max_attempts(self):
        return self.max_attempts

    def __str__(self):
        return f"WordleQuiz: {self.target_word}"

class MusicGuess(models.Model):
    quiz_mode = models.ForeignKey(QuizMode, on_delete=models.CASCADE, related_name="music_guess")
    song_title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255, blank=True)
    audio_url = models.CharField(max_length=255, blank=True, help_text="Contoh: /static/audio/lagu1.mp3")
    
    # New fields required by views.py
    lyrics_snippet = models.TextField(blank=True)
    hint_1 = models.CharField(max_length=255, blank=True)
    hint_2 = models.CharField(max_length=255, blank=True)
    fun_fact = models.TextField(blank=True)
    distractors = models.TextField(blank=True, help_text="Pilihan salah, pisahkan dengan koma.")

    def get_distractors_list(self):
        return [d.strip() for d in self.distractors.split(',')] if self.distractors else ["Pilihan Salah 1", "Pilihan Salah 2", "Pilihan Salah 3"]

    def __str__(self):
        return f"MusicGuess: {self.song_title}"