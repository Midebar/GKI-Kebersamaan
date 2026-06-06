/* Scripture Word — Dynamic Wordle */

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫']
];

let ws = {
  score: 0, total: 0,
  answer: '', length: 0, maxAttempts: 0,
  currentRow: 0, currentGuess: '',
  letterStates: {}, gameOver: false,
  hint2Shown: false, data: null
};

async function loadQuestion() {
  ws = { ...ws, answer: '', length: 0, maxAttempts: 0,
         currentRow: 0, currentGuess: '', letterStates: {},
         gameOver: false, hint2Shown: false, data: null };

  document.getElementById('loading').style.display = 'block';
  document.getElementById('body').style.display = 'none';
  document.getElementById('next-ctrl').style.display = 'none';
  setFeedback('', '');

  try {
    const r = await fetch('/api/wordle/');
    if (!r.ok) { const e = await r.json(); showError(e.error); return; }
    ws.data = await r.json();
    ws.answer = ws.data.word;
    ws.length = ws.data.length;
    ws.maxAttempts = ws.data.max_attempts;
    renderWordle(ws.data);
  } catch(e) { showError('Connection error. Please refresh.'); }
}

function renderWordle(d) {
  document.getElementById('wordle-cat').textContent = `📂 ${d.category}`;
  document.getElementById('wordle-len').textContent = `${d.length} letters`;
  document.getElementById('wordle-att').textContent = `${d.max_attempts} attempts`;
  document.getElementById('hint-text').textContent = d.hint;
  document.getElementById('hint2-strip').style.display = 'none';
  document.getElementById('fun-fact').style.display = 'none';

  document.getElementById('wordle-input').maxLength = d.length;
  document.getElementById('wordle-input').placeholder = `${d.length}-letter word…`;
  document.getElementById('wordle-input').value = '';

  buildGrid();
  buildKeyboard();

  document.getElementById('loading').style.display = 'none';
  document.getElementById('body').style.display = 'block';
  document.getElementById('wordle-input').focus();
}

function buildGrid() {
  const grid = document.getElementById('wordle-grid');
  grid.innerHTML = '';
  for (let r = 0; r < ws.maxAttempts; r++) {
    const row = document.createElement('div');
    row.className = 'wordle-row';
    row.id = `row-${r}`;
    for (let c = 0; c < ws.length; c++) {
      const cell = document.createElement('div');
      cell.className = 'wordle-cell';
      cell.id = `cell-${r}-${c}`;
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
}

function buildKeyboard() {
  const kb = document.getElementById('wordle-keyboard');
  kb.innerHTML = '';
  KB_ROWS.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    row.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'kb-key' + (key.length > 1 ? ' wide' : '');
      btn.textContent = key;
      btn.dataset.key = key;
      btn.onclick = () => handleKey(key);
      rowEl.appendChild(btn);
    });
    kb.appendChild(rowEl);
  });
}

function handleKey(key) {
  if (ws.gameOver) return;
  if (key === '⌫' || key === 'BACKSPACE') {
    ws.currentGuess = ws.currentGuess.slice(0, -1);
    syncInput();
    updateRow();
  } else if (key === 'ENTER') {
    submitGuess();
  } else if (/^[A-Z]$/i.test(key) && ws.currentGuess.length < ws.length) {
    ws.currentGuess += key.toUpperCase();
    syncInput();
    updateRow();
  }
}

function syncInput() {
  document.getElementById('wordle-input').value = ws.currentGuess;
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter')     { submitGuess(); return; }
  if (e.key === 'Backspace') { handleKey('BACKSPACE'); return; }
  if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
});

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('wordle-input');
  if (inp) inp.addEventListener('input', e => {
    const v = e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0, ws.length);
    e.target.value = v;
    ws.currentGuess = v;
    updateRow();
  });
});

function updateRow() {
  for (let c = 0; c < ws.length; c++) {
    const cell = document.getElementById(`cell-${ws.currentRow}-${c}`);
    if (!cell) continue;
    const letter = ws.currentGuess[c] || '';
    cell.textContent = letter;
    cell.className = 'wordle-cell' + (letter ? ' filled' : '');
  }
}

async function submitGuess() {
  if (ws.gameOver) return;
  const guess = ws.currentGuess.trim();
  if (guess.length !== ws.length) {
    shakeRow(ws.currentRow);
    setFeedback(`Word must be ${ws.length} letters`, 'info');
    setTimeout(() => setFeedback('', ''), 1800);
    return;
  }

  try {
    const r = await fetch('/api/wordle/check/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess, answer: ws.answer })
    });
    const d = await r.json();
    if (d.error) { setFeedback(d.error, 'info'); return; }

    revealRow(ws.currentRow, d.result);
    d.result.forEach(({ letter, status }) => {
      const p = { correct: 3, present: 2, absent: 1 };
      if (!ws.letterStates[letter] || p[status] > p[ws.letterStates[letter]])
        ws.letterStates[letter] = status;
    });

    ws.currentRow++;
    ws.currentGuess = '';
    document.getElementById('wordle-input').value = '';

    // Reveal hint 2 at halfway
    if (!ws.hint2Shown && ws.data.hint_2 && ws.currentRow >= Math.floor(ws.maxAttempts / 2)) {
      ws.hint2Shown = true;
      document.getElementById('hint2-text').textContent = ws.data.hint_2;
      document.getElementById('hint2-strip').style.display = 'flex';
    }

    const delay = ws.length * 80 + 350;
    if (d.correct) {
      ws.gameOver = true; ws.score++; ws.total++;
      setTimeout(() => {
        setFeedback(`✦ Glorious! The word is "${ws.answer}" ✦`, 'correct');
        showFunFact();
        document.getElementById('next-ctrl').style.display = 'flex';
      }, delay);
      updateScore();
    } else if (ws.currentRow >= ws.maxAttempts) {
      ws.gameOver = true; ws.total++;
      setTimeout(() => {
        setFeedback(`The word was "${ws.answer}". Keep studying! 📖`, 'info');
        showFunFact();
        document.getElementById('next-ctrl').style.display = 'flex';
      }, delay);
      updateScore();
    }
    setTimeout(updateKeyboard, delay);
  } catch(e) { console.error(e); }
}

function revealRow(rowIdx, result) {
  result.forEach(({ letter, status }, col) => {
    setTimeout(() => {
      const cell = document.getElementById(`cell-${rowIdx}-${col}`);
      if (!cell) return;
      cell.textContent = letter;
      cell.className = `wordle-cell flip ${status}`;
    }, col * 80);
  });
}

function shakeRow(rowIdx) {
  for (let c = 0; c < ws.length; c++) {
    const cell = document.getElementById(`cell-${rowIdx}-${c}`);
    if (cell) { cell.classList.add('shake'); setTimeout(() => cell.classList.remove('shake'), 400); }
  }
}

function updateKeyboard() {
  document.querySelectorAll('.kb-key').forEach(btn => {
    const k = btn.dataset.key;
    if (ws.letterStates[k]) {
      btn.className = `kb-key${btn.classList.contains('wide') ? ' wide' : ''} ${ws.letterStates[k]}`;
    }
  });
}

function showFunFact() {
  if (ws.data && ws.data.fun_fact) {
    const ff = document.getElementById('fun-fact');
    ff.textContent = ws.data.fun_fact;
    ff.style.display = 'block';
  }
}

function setFeedback(msg, type) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className = 'feedback' + (type ? ` ${type}` : '');
}

function updateScore() {
  document.getElementById('score').textContent = ws.score;
  document.getElementById('total').textContent = ws.total;
}

function showError(msg) {
  document.getElementById('loading').innerHTML =
    `<p style="color:#ff8090;font-style:italic">${msg}</p>`;
}

loadQuestion();
