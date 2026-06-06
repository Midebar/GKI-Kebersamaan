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

  // Add this inside loadQuestion() right before the fetch() call:
    ws.hintIdx = 0; // Track how many hints have been used
    document.getElementById('hint1-strip').style.display = 'none';
    document.getElementById('hint2-strip').style.display = 'none';
    document.getElementById('hint-btn').disabled = false;
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
  document.getElementById('wordle-len').textContent = `Misteri Huruf`; // Hide the length!
  document.getElementById('wordle-att').textContent = `${d.max_attempts} attempts`;
  document.getElementById('hint-text').textContent = d.hint;
  document.getElementById('hint2-strip').style.display = 'none';
  document.getElementById('fun-fact').style.display = 'none';

  document.getElementById('wordle-input').maxLength = 20;
  document.getElementById('wordle-input').placeholder = `Ketik tebakan...`;
  document.getElementById('wordle-input').value = '';

  // Show the hint button if at least one hint exists in the database
  const hasHints = ws.data.hint || ws.data.hint_2;
  document.getElementById('hint-btn').style.display = hasHints ? 'inline-block' : 'none';

  buildGrid();
  buildKeyboard();

  document.getElementById('loading').style.display = 'none';
  document.getElementById('body').style.display = 'block';
  document.getElementById('wordle-input').focus();
}

function buildGrid() {
  const grid = document.getElementById('wordle-grid');
  grid.innerHTML = '';
  appendWordleRow(0); // Start with just the first row
}

function appendWordleRow(rowIndex) {
  const grid = document.getElementById('wordle-grid');
  const row = document.createElement('div');
  row.className = 'wordle-row';
  row.id = `row-${rowIndex}`;
  
  for (let c = 0; c < 20; c++) {
    const cell = document.createElement('div');
    cell.className = 'wordle-cell'; // The CSS class now handles all styling
    cell.id = `cell-${rowIndex}-${c}`;
    row.appendChild(cell);
  }
  grid.appendChild(row);
}

function updateRow() {
  for (let c = 0; c < 20; c++) {
    const cell = document.getElementById(`cell-${ws.currentRow}-${c}`);
    if (!cell) continue;
    const letter = ws.currentGuess[c] || '';
    cell.textContent = letter;
    
    if (letter) {
        cell.className = 'wordle-cell filled';
        cell.style.border = '2px solid #555'; // Dark border for visibility
        cell.style.background = '#f8f9fa';
        cell.style.color = '#000'; // Ensure text is visible
    } else {
        cell.className = 'wordle-cell';
        cell.style.border = 'none'; 
        cell.style.background = 'transparent';
        cell.style.color = 'transparent';
    }
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

// Update handleKey to restrict to 20 letters instead of the word's exact length
function handleKey(key) {
  if (ws.gameOver) return;
  
  // To avoid duplicate typing, we force the focus away from the physical input box
  const inp = document.getElementById('wordle-input');
  if (document.activeElement === inp) {
      inp.blur(); 
  }

  if (key === '⌫' || key === 'BACKSPACE') {
    ws.currentGuess = ws.currentGuess.slice(0, -1);
    syncInput();
    updateRow();
  } else if (key === 'ENTER') {
    submitGuess();
  } else if (/^[A-Z]$/i.test(key) && ws.currentGuess.length < 20) { // Max 20 chars
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

async function submitGuess() {
  if (ws.gameOver) return;
  const guess = ws.currentGuess.trim();
  
  // Prevent empty submissions but allow ANY length up to 20
  if (guess.length === 0) {
      setFeedback("Tebakan tidak boleh kosong!", 'info');
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
      if (!ws.letterStates[letter] || p[status] > (p[ws.letterStates[letter]] || 0))
        ws.letterStates[letter] = status;
    });

    // The delay must match the length of the *guess*, not the answer
    const delay = guess.length * 80 + 350;
    
    if (d.correct) {
      ws.gameOver = true; ws.score++; ws.total++;
      setTimeout(() => {
        setFeedback(`Benar! Kata yang dicari adalah: "${ws.answer}"`, 'correct');
        showFunFact();
        document.getElementById('next-ctrl').style.display = 'flex';
        if (typeof showAwardButtons === "function") showAwardButtons();
      }, delay);
    } else {
      ws.currentRow++;
      ws.currentGuess = '';
      syncInput();
      
      setTimeout(() => {
        appendWordleRow(ws.currentRow);
        if (!ws.hint2Shown && ws.data.hint_2 && ws.currentRow >= 4) {
          ws.hint2Shown = true;
          document.getElementById('hint2-text').textContent = ws.data.hint_2;
          document.getElementById('hint2-strip').style.display = 'flex';
        }
      }, delay);
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
      
      // We add 'flip' AND the status (correct/present/absent)
      // The CSS 'flip' class triggers the animation.
      cell.className = `wordle-cell flip ${status}`;
      
    }, col * 150); // Increased delay for a more "cinematic" reveal
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

function showHint() {
  if (ws.hintIdx === 0 && ws.data.hint) {
      document.getElementById('hint-text').textContent = ws.data.hint;
      document.getElementById('hint1-strip').style.display = 'flex';
      ws.hintIdx++;
  } else if (ws.hintIdx === 1 && ws.data.hint_2) {
      document.getElementById('hint2-text').textContent = ws.data.hint_2;
      document.getElementById('hint2-strip').style.display = 'flex';
      ws.hintIdx++;
  }
  
  // Disable the button if there are no more hints left
  const totalHints = (ws.data.hint ? 1 : 0) + (ws.data.hint_2 ? 1 : 0);
  if (ws.hintIdx >= totalHints) {
      document.getElementById('hint-btn').disabled = true;
  }
}

loadQuestion();
