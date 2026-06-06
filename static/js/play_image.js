/* Reveal & Guess — Progressive Image Reveal */

const GRID_COLS = 8;
const GRID_ROWS = 6;
const REVEAL_STEP = 4; // tiles to reveal per click

let imgState = {
  score: 0, total: 0, answered: false,
  data: null, image: null,
  totalTiles: GRID_COLS * GRID_ROWS,
  revealedCount: 0,
  hintIdx: 0,
  tileOrder: []   // shuffled tile indices
};

async function loadQuestion() {
  imgState.answered = false;
  imgState.revealedCount = 0;
  imgState.hintIdx = 0;
  imgState.tileOrder = [];

  document.getElementById('loading').style.display = 'block';
  document.getElementById('body').style.display = 'none';
  document.getElementById('next-btn').style.display = 'none';
  document.getElementById('reveal-btn').disabled = false;
  document.getElementById('reveal-pct').textContent = '0';
  document.getElementById('hint-strip').style.display = 'none';
  document.getElementById('fun-fact').style.display = 'none';
  setFeedback('', '');

  try {
    const r = await fetch('/api/image/');
    if (!r.ok) { const e = await r.json(); showError(e.error); return; }
    imgState.data = await r.json();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgState.image = img;
      renderImage(img, imgState.data);
    };
    img.onerror = () => {
      // Fallback: show placeholder
      renderWithoutImage(imgState.data);
    };
    img.src = imgState.data.image_url;
  } catch(e) { showError('Connection error. Please refresh.'); }
}

function renderImage(img, d) {
  const canvas = document.getElementById('img-canvas');
  const maxW = Math.min(canvas.parentElement.offsetWidth - 2, 640);
  const ratio = img.naturalHeight / img.naturalWidth;
  canvas.width = maxW;
  canvas.height = Math.round(maxW * ratio);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  buildFragmentTiles(canvas.width, canvas.height);
  renderChoices(d);

  document.getElementById('loading').style.display = 'none';
  document.getElementById('body').style.display = 'block';
}

function renderWithoutImage(d) {
  const canvas = document.getElementById('img-canvas');
  canvas.width = 480; canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e3350';
  ctx.fillRect(0, 0, 480, 320);
  ctx.fillStyle = 'rgba(200,134,12,0.4)';
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(d.category === 'person' ? '👤' : '🖼️', 240, 160);

  buildFragmentTiles(480, 320);
  renderChoices(d);

  document.getElementById('loading').style.display = 'none';
  document.getElementById('body').style.display = 'block';
}

function buildFragmentTiles(cw, ch) {
  const overlay = document.getElementById('reveal-overlay');
  overlay.innerHTML = '';

  const tw = cw / GRID_COLS;
  const th = ch / GRID_ROWS;

  imgState.totalTiles = GRID_COLS * GRID_ROWS;
  imgState.tileOrder = shuffle(Array.from({ length: imgState.totalTiles }, (_, i) => i));

  for (let i = 0; i < imgState.totalTiles; i++) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const tile = document.createElement('div');
    tile.className = 'frag-tile';
    tile.id = `tile-${i}`;
    tile.style.left = `${col * tw}px`;
    tile.style.top  = `${row * th}px`;
    tile.style.width  = `${tw + 1}px`;
    tile.style.height = `${th + 1}px`;
    overlay.appendChild(tile);
  }
}

function renderChoices(d) {
  const container = document.getElementById('choices');
  container.innerHTML = '';
  d.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(choice, d.answer, btn);
    container.appendChild(btn);
  });
}

function revealMore() {
  if (imgState.answered) return;
  const d = imgState.data;
  const remaining = imgState.tileOrder.slice(imgState.revealedCount);
  if (remaining.length === 0) return;

  const batch = remaining.slice(0, REVEAL_STEP);
  batch.forEach(idx => {
    const tile = document.getElementById(`tile-${idx}`);
    if (tile) tile.classList.add('revealed');
    imgState.revealedCount++;
  });

  const pct = Math.round((imgState.revealedCount / imgState.totalTiles) * 100);
  document.getElementById('reveal-pct').textContent = pct;

  // Show progressive hints
  if (d.hints && pct >= 25 && imgState.hintIdx === 0 && d.hints[0]) {
    imgState.hintIdx = 1;
    document.getElementById('hint-text').textContent = d.hints[0];
    document.getElementById('hint-strip').style.display = 'flex';
  } else if (d.hints && pct >= 55 && imgState.hintIdx === 1 && d.hints[1]) {
    imgState.hintIdx = 2;
    document.getElementById('hint-text').textContent = d.hints[1];
  } else if (d.hints && pct >= 80 && imgState.hintIdx === 2 && d.hints[2]) {
    imgState.hintIdx = 3;
    document.getElementById('hint-text').textContent = d.hints[2];
  }

  if (imgState.revealedCount >= imgState.totalTiles) {
    document.getElementById('reveal-btn').disabled = true;
    document.getElementById('reveal-pct').textContent = '100';
  }
}

function checkAnswer(guess, answer, btn) {
  if (imgState.answered) return;
  imgState.answered = true;
  imgState.total++;

  // Reveal all tiles
  for (let i = 0; i < imgState.totalTiles; i++) {
    const tile = document.getElementById(`tile-${i}`);
    if (tile) tile.classList.add('revealed');
  }
  document.getElementById('reveal-pct').textContent = '100';
  document.getElementById('reveal-btn').disabled = true;

  document.querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true;
    if (b.textContent === answer) b.classList.add('correct');
  });

  if (guess === answer) {
    imgState.score++;
    setFeedback(`✦ Correct! "${answer}" ✦`, 'correct');
  } else {
    btn.classList.add('wrong');
    setFeedback(`The answer is "${answer}"`, 'wrong');
  }

  if (imgState.data.fun_fact) {
    const ff = document.getElementById('fun-fact');
    ff.textContent = imgState.data.fun_fact;
    ff.style.display = 'block';
  }

  document.getElementById('next-btn').style.display = 'inline-block';
  updateScore();
}

function setFeedback(msg, type) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className = 'feedback' + (type ? ` ${type}` : '');
}

function updateScore() {
  document.getElementById('score').textContent = imgState.score;
  document.getElementById('total').textContent = imgState.total;
}

function showError(msg) {
  document.getElementById('loading').innerHTML =
    `<p style="color:#ff8090;font-style:italic">${msg}</p>`;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

loadQuestion();
