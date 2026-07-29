"use strict";

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

const canvas = document.querySelector("#game-canvas");
const context = canvas?.getContext("2d");
const startButton = document.querySelector("#start-game");
const pauseButton = document.querySelector("#pause-game");
const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#high-score");
const statusElement = document.querySelector("#game-status");
const gridSize = 20;
const tileSize = canvas ? canvas.width / gridSize : 24;
let snake = [];
let food = { x: 12, y: 10 };
let enemy = { x: 16, y: 5, direction: { x: -1, y: 0 } };
let direction = { x: 1, y: 0 };
let queuedDirection = { x: 1, y: 0 };
let timer = null;
let score = 0;
let highScore = Number(localStorage.getItem("dh-snake-high-score") || 0);
let running = false;
let paused = false;

if (highScoreElement) highScoreElement.textContent = String(highScore);

function randomCell() { return Math.floor(Math.random() * gridSize); }
function sameCell(a, b) { return a.x === b.x && a.y === b.y; }

function resetGame() {
  snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  food = { x: 12, y: 10 };
  enemy = { x: 16, y: 5, direction: { x: -1, y: 0 } };
  score = 0;
  if (scoreElement) scoreElement.textContent = "0";
  draw();
}

function placeFood() {
  do { food = { x: randomCell(), y: randomCell() }; } while (snake.some((part) => sameCell(part, food)) || sameCell(enemy, food));
}

function moveEnemy() {
  const next = { x: enemy.x + enemy.direction.x, y: enemy.y + enemy.direction.y };
  if (next.x < 0 || next.x >= gridSize || next.y < 0 || next.y >= gridSize || Math.random() < 0.18) {
    const choices = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].filter((choice) => !(choice.x === -enemy.direction.x && choice.y === -enemy.direction.y));
    enemy.direction = choices[Math.floor(Math.random() * choices.length)];
  }
  const moved = { x: enemy.x + enemy.direction.x, y: enemy.y + enemy.direction.y };
  if (moved.x >= 0 && moved.x < gridSize && moved.y >= 0 && moved.y < gridSize) enemy = { x: moved.x, y: moved.y, direction: enemy.direction };
}

function tick() {
  direction = queuedDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
  const hitSelf = snake.some((part) => sameCell(part, head));
  moveEnemy();
  if (hitWall || hitSelf || sameCell(head, enemy)) return endGame("게임 오버! 다시 도전해보세요.");
  snake.unshift(head);
  if (sameCell(head, food)) { score += 10; if (scoreElement) scoreElement.textContent = String(score); if (score > highScore) { highScore = score; localStorage.setItem("dh-snake-high-score", String(highScore)); if (highScoreElement) highScoreElement.textContent = String(highScore); } placeFood(); } else snake.pop();
  draw();
}

function draw() {
  if (!context) return;
  context.fillStyle = "#0d294b"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(148, 198, 239, .08)";
  for (let i = 1; i < gridSize; i += 1) { context.beginPath(); context.moveTo(i * tileSize, 0); context.lineTo(i * tileSize, canvas.height); context.stroke(); context.beginPath(); context.moveTo(0, i * tileSize); context.lineTo(canvas.width, i * tileSize); context.stroke(); }
  context.fillStyle = "#efc15b"; context.beginPath(); context.arc((food.x + .5) * tileSize, (food.y + .5) * tileSize, tileSize * .3, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#ef5b5b"; context.beginPath(); context.arc((enemy.x + .5) * tileSize, (enemy.y + .5) * tileSize, tileSize * .36, 0, Math.PI * 2); context.fill();
  snake.forEach((part, index) => { context.fillStyle = index === 0 ? "#8bd0ff" : "#3b94e8"; context.beginPath(); context.roundRect(part.x * tileSize + 2, part.y * tileSize + 2, tileSize - 4, tileSize - 4, 5); context.fill(); });
}

function endGame(message) { running = false; paused = false; clearInterval(timer); timer = null; if (pauseButton) pauseButton.disabled = true; if (statusElement) statusElement.textContent = message; draw(); }
function startGame() { clearInterval(timer); resetGame(); running = true; paused = false; if (pauseButton) { pauseButton.disabled = false; pauseButton.textContent = "일시정지"; } if (statusElement) statusElement.textContent = "빨간 적을 피하세요!"; timer = setInterval(() => { if (!paused) tick(); }, 155); }
function setDirection(next) { if (!running || paused || (next.x === -direction.x && next.y === -direction.y)) return; queuedDirection = next; }

document.addEventListener("keydown", (event) => { const keys = { ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 } }; if (keys[event.key]) { event.preventDefault(); setDirection(keys[event.key]); } if (event.key === "p" && running) togglePause(); });
function togglePause() { paused = !paused; if (pauseButton) pauseButton.textContent = paused ? "계속하기" : "일시정지"; if (statusElement) statusElement.textContent = paused ? "일시정지 중" : "계속 진행 중"; }
startButton?.addEventListener("click", startGame); pauseButton?.addEventListener("click", togglePause);
document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => { const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }; setDirection(directions[button.dataset.direction]); }));
resetGame();

// Tetris
const tetrisCanvas = document.querySelector("#tetris-canvas");
const tetrisContext = tetrisCanvas?.getContext("2d");
const tetrisStart = document.querySelector("#start-tetris");
const tetrisPause = document.querySelector("#pause-tetris");
const tetrisScore = document.querySelector("#tetris-score");
const tetrisLevel = document.querySelector("#tetris-level");
const tetrisHighScore = document.querySelector("#tetris-high-score");
const tetrisStatus = document.querySelector("#tetris-status");
const tetrisColumns = 10;
const tetrisRows = 20;
const tetrisCell = 24;
const tetrisColors = ["#58b7ff", "#f3c85b", "#b68cff", "#59d69b", "#ef6d77", "#6f8cff", "#ff9d62"];
const tetrisShapes = [
  [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]]
];
let tetrisBoard = [];
let tetrisPiece = null;
let tetrisTimer = null;
let tetrisRunning = false;
let tetrisPaused = false;
let tetrisPoints = 0;
let tetrisLines = 0;
let tetrisBest = Number(localStorage.getItem("dh-tetris-high-score") || 0);
if (tetrisHighScore) tetrisHighScore.textContent = String(tetrisBest);

function createTetrisBoard() { return Array.from({ length: tetrisRows }, () => Array(tetrisColumns).fill(0)); }
function newTetrisPiece() { const type = Math.floor(Math.random() * tetrisShapes.length); const shape = tetrisShapes[type].map((row) => [...row]); return { shape, color: type + 1, x: Math.floor((tetrisColumns - shape[0].length) / 2), y: 0 }; }
function tetrisCollides(piece, dx = 0, dy = 0, shape = piece.shape) { return shape.some((row, y) => row.some((cell, x) => { if (!cell) return false; const nextX = piece.x + x + dx; const nextY = piece.y + y + dy; return nextX < 0 || nextX >= tetrisColumns || nextY >= tetrisRows || (nextY >= 0 && tetrisBoard[nextY][nextX]); })); }
function rotateTetrisPiece() { const rotated = tetrisPiece.shape[0].map((_, index) => tetrisPiece.shape.map((row) => row[index]).reverse()); if (!tetrisCollides(tetrisPiece, 0, 0, rotated)) tetrisPiece.shape = rotated; else if (!tetrisCollides(tetrisPiece, 1, 0, rotated)) { tetrisPiece.x += 1; tetrisPiece.shape = rotated; } else if (!tetrisCollides(tetrisPiece, -1, 0, rotated)) { tetrisPiece.x -= 1; tetrisPiece.shape = rotated; } }
function mergeTetrisPiece() { tetrisPiece.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell && tetrisPiece.y + y >= 0) tetrisBoard[tetrisPiece.y + y][tetrisPiece.x + x] = tetrisPiece.color; })); }
function clearTetrisLines() { let cleared = 0; tetrisBoard = tetrisBoard.filter((row) => { if (row.every(Boolean)) { cleared += 1; return false; } return true; }); while (tetrisBoard.length < tetrisRows) tetrisBoard.unshift(Array(tetrisColumns).fill(0)); if (cleared) { tetrisLines += cleared; tetrisPoints += [0, 100, 300, 500, 800][cleared] * tetrisLevelValue(); updateTetrisScore(); } }
function tetrisLevelValue() { return Math.floor(tetrisLines / 10) + 1; }
function updateTetrisScore() { if (tetrisScore) tetrisScore.textContent = String(tetrisPoints); if (tetrisLevel) tetrisLevel.textContent = String(tetrisLevelValue()); if (tetrisPoints > tetrisBest) { tetrisBest = tetrisPoints; localStorage.setItem("dh-tetris-high-score", String(tetrisBest)); if (tetrisHighScore) tetrisHighScore.textContent = String(tetrisBest); } }
function drawTetris() { if (!tetrisContext) return; tetrisContext.fillStyle = "#0b1d34"; tetrisContext.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height); tetrisBoard.forEach((row, y) => row.forEach((value, x) => { if (value) drawTetrisCell(x, y, tetrisColors[value - 1]); })); if (tetrisPiece) tetrisPiece.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell) drawTetrisCell(tetrisPiece.x + x, tetrisPiece.y + y, tetrisColors[tetrisPiece.color - 1]); })); }
function drawTetrisCell(x, y, color) { if (y < 0) return; tetrisContext.fillStyle = color; tetrisContext.fillRect(x * tetrisCell + 1, y * tetrisCell + 1, tetrisCell - 2, tetrisCell - 2); tetrisContext.strokeStyle = "rgba(255,255,255,.22)"; tetrisContext.strokeRect(x * tetrisCell + 2, y * tetrisCell + 2, tetrisCell - 4, tetrisCell - 4); }
function dropTetrisPiece() { if (!tetrisPiece || tetrisPaused || !tetrisRunning) return; if (!tetrisCollides(tetrisPiece, 0, 1)) tetrisPiece.y += 1; else { mergeTetrisPiece(); clearTetrisLines(); tetrisPiece = newTetrisPiece(); if (tetrisCollides(tetrisPiece)) endTetris("게임 오버! 다시 쌓아보세요."); } drawTetris(); }
function hardDropTetris() { if (!tetrisPiece || tetrisPaused || !tetrisRunning) return; while (!tetrisCollides(tetrisPiece, 0, 1)) tetrisPiece.y += 1; dropTetrisPiece(); }
function endTetris(message) { tetrisRunning = false; tetrisPaused = false; clearInterval(tetrisTimer); tetrisTimer = null; if (tetrisPause) tetrisPause.disabled = true; if (tetrisStatus) tetrisStatus.textContent = message; drawTetris(); }
function startTetris() { clearInterval(tetrisTimer); tetrisBoard = createTetrisBoard(); tetrisPiece = newTetrisPiece(); tetrisPoints = 0; tetrisLines = 0; tetrisRunning = true; tetrisPaused = false; updateTetrisScore(); if (tetrisPause) { tetrisPause.disabled = false; tetrisPause.textContent = "일시정지"; } if (tetrisStatus) tetrisStatus.textContent = "빈틈없이 쌓아보세요!"; tetrisTimer = setInterval(dropTetrisPiece, 720); drawTetris(); }
function toggleTetrisPause() { if (!tetrisRunning) return; tetrisPaused = !tetrisPaused; if (tetrisPause) tetrisPause.textContent = tetrisPaused ? "계속하기" : "일시정지"; if (tetrisStatus) tetrisStatus.textContent = tetrisPaused ? "일시정지 중" : "게임 진행 중"; }
function moveTetris(dx) { if (tetrisPiece && !tetrisPaused && tetrisRunning && !tetrisCollides(tetrisPiece, dx, 0)) { tetrisPiece.x += dx; drawTetris(); } }
document.addEventListener("keydown", (event) => { if (!tetrisRunning) return; if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) event.preventDefault(); if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") moveTetris(-1); if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") moveTetris(1); if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") dropTetrisPiece(); if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") rotateTetrisPiece(), drawTetris(); if (event.key === " ") hardDropTetris(); if (event.key.toLowerCase() === "p") toggleTetrisPause(); });
tetrisStart?.addEventListener("click", startTetris); tetrisPause?.addEventListener("click", toggleTetrisPause);
document.querySelectorAll("[data-tetris]").forEach((button) => button.addEventListener("click", () => { const action = button.dataset.tetris; if (action === "left") moveTetris(-1); if (action === "right") moveTetris(1); if (action === "down") dropTetrisPiece(); if (action === "rotate") { rotateTetrisPiece(); drawTetris(); } if (action === "drop") hardDropTetris(); }));
tetrisBoard = createTetrisBoard();
drawTetris();
