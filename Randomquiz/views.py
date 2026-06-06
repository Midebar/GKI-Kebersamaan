import json
import random
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import ImageGuess, ChapterGuess, WordleQuiz, MusicGuess, Team


# ─── Page Views ───────────────────────────────────────────────

def quiz_home(request):
    return render(request, "Randomquiz/index.html")

def quiz_image(request):
    return render(request, 'Randomquiz/play_image.html')

def quiz_bible(request):
    return render(request, 'Randomquiz/play_chapter.html')

def quiz_wordle(request):  
    return render(request, 'Randomquiz/play_wordle.html')

def quiz_music(request):
    return render(request, 'Randomquiz/play_music.html')


# ─── API: Random question fetchers ────────────────────────────

@require_GET
def api_image(request):
    qs = ImageGuess.objects.all()
    if not qs.exists():
        return JsonResponse({'error': 'No image questions found. Add some via /admin.'}, status=404)
    item = random.choice(list(qs))
    choices = _build_choices(item.answer, item.get_distractors_list(), 4)
    return JsonResponse({
        'id': item.pk,
        'image_url': item.image_url,
        'answer': item.answer,
        'category': item.get_category_display(),
        'hints': [h for h in [item.hint_1, item.hint_2, item.hint_3] if h],
        'choices': choices,
        'fun_fact': item.fun_fact,
    })


@require_GET
def api_chapter(request):
    qs = ChapterGuess.objects.all()
    if not qs.exists():
        return JsonResponse({'error': 'No chapter questions found. Add some via /admin.'}, status=404)
    item = random.choice(list(qs))
    choices = _build_choices(item.answer, item.get_distractors_list(), 4)
    return JsonResponse({
        'id': item.pk,
        'guess_type': item.guess_type,
        'guess_type_display': item.get_guess_type_display(),
        'verse_text': item.verse_text,
        'verse_reference': item.verse_reference,
        'answer': item.answer,
        'hints': [h for h in [item.hint_1, item.hint_2] if h],
        'choices': choices,
        'fun_fact': item.fun_fact,
    })


@require_GET
def api_wordle(request):
    qs = WordleQuiz.objects.all()
    if not qs.exists():
        return JsonResponse({'error': 'No wordle questions found. Add some via /admin.'}, status=404)
    item = random.choice(list(qs))
    return JsonResponse({
        'id': item.pk,
        'word': item.target_word,
        'length': len(item.target_word),
        'category': item.get_category_display(),
        'hint': item.hint,
        'hint_2': item.hint_2,
        'max_attempts': item.get_max_attempts(),
        'fun_fact': item.fun_fact,
    })


@csrf_exempt
@require_POST
def api_wordle_check(request):
    data = json.loads(request.body)
    guess = data.get('guess', '').upper().strip()
    answer = data.get('answer', '').upper().strip()

    if not guess:
        return JsonResponse({'error': 'Tebakan tidak boleh kosong'}, status=400)

    answer_chars = list(answer)
    guess_chars = list(guess)
    used = [False] * len(answer)
    marks = ['absent'] * len(guess)

    # Pass 1: Cek posisi yang tepat (Hijau)
    min_length = min(len(guess), len(answer))
    for i in range(min_length):
        if guess_chars[i] == answer_chars[i]:
            marks[i] = 'correct'
            used[i] = True

    # Pass 2: Cek huruf yang ada tapi salah posisi (Kuning)
    for i in range(len(guess)):
        if marks[i] == 'correct':
            continue
        for j in range(len(answer)):
            if not used[j] and guess_chars[i] == answer_chars[j]:
                marks[i] = 'present'
                used[j] = True
                break

    result = [{'letter': guess_chars[i], 'status': marks[i]} for i in range(len(guess_chars))]
    return JsonResponse({'result': result, 'correct': guess == answer})


@require_GET
def api_music(request):
    qs = MusicGuess.objects.all()
    if not qs.exists():
        return JsonResponse({'error': 'No music questions found. Add some via /admin.'}, status=404)
    item = random.choice(list(qs))
    choices = _build_choices(item.song_title, item.get_distractors_list(), 4)
    return JsonResponse({
        'id': item.pk,
        'song_title': item.song_title,
        'artist': item.artist,
        'lyrics_snippet': item.lyrics_snippet,
        'audio_url': item.audio_url,
        'hints': [h for h in [item.hint_1, item.hint_2] if h],
        'choices': choices,
        'fun_fact': item.fun_fact,
    })


@require_GET
def api_get_teams(request):
    teams = Team.objects.filter(is_active=True).order_by('id')
    data = [{'id': t.id, 'name': t.name, 'score': t.score} for t in teams]
    return JsonResponse({'teams': data})

@csrf_exempt
@require_POST
def api_award_points(request):
    data = json.loads(request.body)
    team_id = data.get('team_id')
    points = data.get('points', 10) # Default 10 points per correct answer
    
    try:
        team = Team.objects.get(id=team_id)
        team.score += points
        team.save()
        return JsonResponse({'success': True, 'new_score': team.score})
    except Team.DoesNotExist:
        return JsonResponse({'error': 'Team not found'}, status=404)


# ─── Helpers ──────────────────────────────────────────────────

def _build_choices(correct, distractors, count=4):
    pool = [d for d in distractors if d != correct]
    random.shuffle(pool)
    selected = pool[:count - 1]
    choices = selected + [correct]
    random.shuffle(choices)
    return choices
