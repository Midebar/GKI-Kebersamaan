/* Hymn Quest — Music Guessing Game */
let state = { score: 0, total: 0, answered: false, hintIdx: 0, data: null };

async function loadQuestion() {
  state.answered = false;
  state.hintIdx = 0;
  document.getElementById('loading').style.display = 'block';
  document.getElementById('body').style.display = 'none';
  setFeedback('', '');

  try {
    const r = await fetch('/api/music/');
    if (!r.ok) { const e = await r.json(); showError(e.error); return; }
    state.data = await r.json();
    render(state.data);
  } catch(e) { showError('Connection error. Please refresh.'); }
}

function render(d) {
  document.getElementById('lyrics').textContent = d.lyrics_snippet;

  const audioSec = document.getElementById('audio-section');
  if (d.audio_url) {
    document.getElementById('audio-player').src = d.audio_url;
    audioSec.style.display = 'block';
  } else {
    audioSec.style.display = 'none';
  }

  document.getElementById('hint-strip').style.display = 'none';
  document.getElementById('hint-btn').style.display = d.hints.length ? 'inline-block' : 'none';
  document.getElementById('fun-fact').style.display = 'none';

  const container = document.getElementById('choices');
  container.innerHTML = '';
  d.choices.forEach(title => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = title;
    btn.onclick = () => checkAnswer(title, d.song_title, btn);
    container.appendChild(btn);
  });

  document.getElementById('loading').style.display = 'none';
  document.getElementById('body').style.display = 'block';
}

function showHint() {
  const d = state.data;
  if (!d || !d.hints.length) return;
  const hint = d.hints[state.hintIdx] || d.hints[d.hints.length - 1];
  state.hintIdx = Math.min(state.hintIdx + 1, d.hints.length - 1);
  document.getElementById('hint-text').textContent = hint;
  document.getElementById('hint-strip').style.display = 'flex';
  if (state.hintIdx >= d.hints.length - 1)
    document.getElementById('hint-btn').disabled = true;
}

function checkAnswer(guess, answer, btn) {
  if (state.answered) return;
  state.answered = true;
  state.total++;

  document.querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true;
    if (b.textContent === answer) b.classList.add('correct');
  });

  if (guess === answer) {
    state.score++;
    setFeedback(`✦ Correct! "${answer}" — well sung! ✦`, 'correct');
  } else {
    btn.classList.add('wrong');
    setFeedback(`The answer is "${answer}"`, 'wrong');
  }

  if (state.data.fun_fact) {
    const ff = document.getElementById('fun-fact');
    ff.textContent = state.data.fun_fact;
    ff.style.display = 'block';
  }

  updateScore();
}

function setFeedback(msg, type) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className = 'feedback' + (type ? ` ${type}` : '');
}

function updateScore() {
  document.getElementById('score').textContent = state.score;
  document.getElementById('total').textContent = state.total;
}

function showError(msg) {
  document.getElementById('loading').innerHTML =
    `<p style="color:#ff8090;font-style:italic">${msg}</p>`;
}

loadQuestion();
