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
