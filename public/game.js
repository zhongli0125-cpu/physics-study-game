const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let gameStarted = false;
let gravity = 0.6, level = 1, score = 0, gameOver = false, levelComplete = false, timer = 0;
let fireboy = { x: 50, y: 300, w: 24, h: 32, vx: 0, vy: 0, speed: 4, jumpPower: 12, onGround: false, alive: true, color: "#ff4500", inDoor: false };
let watergirl = { x: 100, y: 300, w: 24, h: 32, vx: 0, vy: 0, speed: 4, jumpPower: 12, onGround: false, alive: true, color: "#1e90ff", inDoor: false };
let keys = {};
document.addEventListener("keydown", e => { keys[e.key] = true; if (gameOver && e.key === 'r') resetLevel(); });
document.addEventListener("keyup", e => keys[e.key] = false);
let platforms = [], lavaZones = [], waterZones = [], greenZones = [], collectibles = [];
let doors = { fire: null, water: null }, questionGate = null, isAnswering = false;
let gameDifficulty = 'easy';

function setDifficulty(diff) {
  gameDifficulty = diff;
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
  window.event.target.classList.add('active');
}

function startGame() { gameStarted = true; const btn = document.getElementById('startButton'); if (btn) btn.style.display = 'none'; initLevel(1); }

function initLevel(lvl) {
  platforms = []; lavaZones = []; waterZones = []; greenZones = []; collectibles = [];
  gameOver = false; levelComplete = false; timer = 0;
  platforms.push({ x: 0, y: 460, w: 800, h: 40, type: 'ground' });
  if (lvl === 1) {
    platforms.push({ x: 200, y: 400, w: 100, h: 20, type: 'platform' });
    platforms.push({ x: 350, y: 340, w: 100, h: 20, type: 'platform' });
    platforms.push({ x: 500, y: 280, w: 100, h: 20, type: 'platform' });
    lavaZones.push({ x: 250, y: 440, w: 80, h: 20 });
    waterZones.push({ x: 450, y: 440, w: 80, h: 20 });
    greenZones.push({ x: 600, y: 440, w: 80, h: 20 });
    doors.fire = { x: 700, y: 380, w: 30, h: 50 };
    doors.water = { x: 740, y: 380, w: 30, h: 50 };
    collectibles.push({ x: 220, y: 370, type: 'fire', collected: false });
    collectibles.push({ x: 370, y: 310, type: 'water', collected: false });
    const filteredQuestions = questionPool.filter(q => q.diff === gameDifficulty);
    const randomQ1 = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
    if (gameDifficulty === 'hard') {
      questionGate = { x: 500, y: 200, w: 60, h: 80, question: randomQ1.q, answer: randomQ1.ans, passed: false };
    } else {
      questionGate = { x: 500, y: 200, w: 60, h: 80, question: randomQ1.q, options: randomQ1.opts, answer: randomQ1.ans, passed: false };
    }
  } else {
    for (let i = 0; i < 6; i++) platforms.push({ x: 100 + i * 120, y: 380 + (Math.random() > 0.5 ? -60 : 60), w: 80, h: 20, type: 'platform' });
    lavaZones.push({ x: 150 + Math.random() * 200, y: 440, w: 100, h: 20 });
    waterZones.push({ x: 400 + Math.random() * 200, y: 440, w: 100, h: 20 });
    greenZones.push({ x: 50, y: 440, w: 80, h: 20 });
    doors.fire = { x: 700, y: 360, w: 30, h: 50 };
    doors.water = { x: 750, y: 360, w: 30, h: 50 };
    const filteredQuestions = questionPool.filter(q => q.diff === gameDifficulty);
    const randomQ2 = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
    if (gameDifficulty === 'hard') {
      questionGate = { x: 400, y: 200, w: 60, h: 80, question: randomQ2.q, answer: randomQ2.ans, passed: false };
    } else {
      questionGate = { x: 400, y: 200, w: 60, h: 80, question: randomQ2.q, options: randomQ2.opts, answer: randomQ2.ans, passed: false };
    }
  }
  fireboy.x = 50; fireboy.y = 300; fireboy.vx = 0; fireboy.vy = 0; fireboy.alive = true; fireboy.inDoor = false;
  watergirl.x = 100; watergirl.y = 300; watergirl.vx = 0; watergirl.vy = 0; watergirl.alive = true; watergirl.inDoor = false;
}
function updatePlayer(player, leftKey, rightKey, jumpKey) {
  if (!player.alive) return;
  if (typeof createTrail !== 'undefined') createTrail(player.x + player.w/2, player.y + player.h, player.color);
  player.vx = 0;
  if (keys[leftKey]) player.vx = -player.speed;
  if (keys[rightKey]) player.vx = player.speed;
  player.x += player.vx; player.vy += gravity; player.y += player.vy;
  player.onGround = false;
  platforms.forEach(plat => {
    if (player.x + player.w > plat.x && player.x < plat.x + plat.w && player.y + player.h > plat.y && player.y + player.h < plat.y + 20 && player.vy >= 0) {
      player.y = plat.y - player.h; player.vy = 0; player.onGround = true;
    }
  });
  if (keys[jumpKey] && player.onGround) { player.vy = -player.jumpPower; player.onGround = false; if (typeof playJump !== 'undefined') playJump(); }
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
  if (player.y > canvas.height) { player.alive = false; if (typeof playDeath !== 'undefined') playDeath(); }
  if (player === fireboy) {
    waterZones.forEach(zone => { if (checkCollision(player, zone)) { player.alive = false; if (typeof playDeath !== 'undefined') playDeath(); if (typeof createParticles !== 'undefined') createParticles(player.x + player.w/2, player.y + player.h/2, '#1e90ff', 20); } });
  } else {
    lavaZones.forEach(zone => { if (checkCollision(player, zone)) { player.alive = false; if (typeof playDeath !== 'undefined') playDeath(); if (typeof createParticles !== 'undefined') createParticles(player.x + player.w/2, player.y + player.h/2, '#ff4500', 20); } });
  }
  greenZones.forEach(zone => { if (checkCollision(player, zone)) { player.alive = false; if (typeof playDeath !== 'undefined') playDeath(); if (typeof createParticles !== 'undefined') createParticles(player.x + player.w/2, player.y + player.h/2, '#32cd32', 20); } });
  collectibles.forEach(item => {
    if (!item.collected && checkCollision(player, { x: item.x, y: item.y, w: 20, h: 20 })) {
      if ((item.type === 'fire' && player === fireboy) || (item.type === 'water' && player === watergirl)) {
        item.collected = true; score += 10;
        if (typeof playCollect !== 'undefined') playCollect();
        if (typeof createParticles !== 'undefined') createParticles(item.x + 10, item.y + 10, item.type === 'fire' ? '#ff4500' : '#1e90ff', 15);
      }
    }
  });
  if (questionGate && !questionGate.passed && !isAnswering && checkCollision(player, questionGate)) askQuestion();
  if (player === fireboy && doors.fire && checkCollision(player, doors.fire)) fireboy.inDoor = true;
  if (player === watergirl && doors.water && checkCollision(player, doors.water)) watergirl.inDoor = true;
}
function checkCollision(a, b) { return a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h; }
function update() {
  if (!gameStarted || gameOver || levelComplete) return;
  timer++;
  updatePlayer(fireboy, 'a', 'd', 'w');
  updatePlayer(watergirl, 'ArrowLeft', 'ArrowRight', 'ArrowUp');
  if (typeof updateParticles !== 'undefined') updateParticles();
  if (fireboy.inDoor && watergirl.inDoor && questionGate.passed) {
    levelComplete = true;
    if (typeof playSuccess !== 'undefined') playSuccess();
    setTimeout(nextLevel, 1500);
  }
  fireboy.inDoor = false; watergirl.inDoor = false;
  if (!fireboy.alive || !watergirl.alive) gameOver = true;
}
function draw() {
  ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!gameStarted) { ctx.fillStyle = "#00ffcc"; ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.fillText('Click START GAME button below!', canvas.width/2, canvas.height/2); return; }
  platforms.forEach(plat => { ctx.fillStyle = plat.type === 'ground' ? '#2d2d44' : '#4a4a6a'; ctx.fillRect(plat.x, plat.y, plat.w, plat.h); ctx.strokeStyle = '#6a6a8a'; ctx.strokeRect(plat.x, plat.y, plat.w, plat.h); });
  lavaZones.forEach(zone => { ctx.fillStyle = '#ff4500'; ctx.fillRect(zone.x, zone.y, zone.w, zone.h); ctx.fillStyle = '#ff6347'; let offset = Math.floor(timer / 10) % 20; for (let i = 0; i < zone.w; i += 20) ctx.fillRect(zone.x + i + offset, zone.y, 10, zone.h); });
  waterZones.forEach(zone => { ctx.fillStyle = '#1e90ff'; ctx.fillRect(zone.x, zone.y, zone.w, zone.h); ctx.fillStyle = '#4169e1'; let offset = Math.floor(timer / 10) % 20; for (let i = 0; i < zone.w; i += 20) ctx.fillRect(zone.x + i + 10 - offset, zone.y, 10, zone.h); });
  greenZones.forEach(zone => { ctx.fillStyle = '#32cd32'; ctx.fillRect(zone.x, zone.y, zone.w, zone.h); });
  if (questionGate && !questionGate.passed) { let glow = Math.sin(timer / 20) * 0.3 + 0.7; ctx.globalAlpha = glow; ctx.fillStyle = '#ffd700'; ctx.fillRect(questionGate.x, questionGate.y, questionGate.w, questionGate.h); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.font = '20px Arial'; ctx.fillText('?', questionGate.x + 22, questionGate.y + 45); }
  collectibles.forEach(item => { if (!item.collected) { let pulse = Math.sin(timer / 15) * 2 + 8; ctx.fillStyle = item.type === 'fire' ? '#ff4500' : '#1e90ff'; ctx.beginPath(); ctx.arc(item.x + 10, item.y + 10, pulse, 0, Math.PI * 2); ctx.fill(); } });
  if (doors.fire) { ctx.fillStyle = '#ff4500'; ctx.fillRect(doors.fire.x, doors.fire.y, doors.fire.w, doors.fire.h); ctx.fillStyle = '#000'; ctx.fillRect(doors.fire.x + 5, doors.fire.y + 10, 20, 30); }
  if (doors.water) { ctx.fillStyle = '#1e90ff'; ctx.fillRect(doors.water.x, doors.water.y, doors.water.w, doors.water.h); ctx.fillStyle = '#000'; ctx.fillRect(doors.water.x + 5, doors.water.y + 10, 20, 30); }
  if (typeof drawParticles !== 'undefined') drawParticles(ctx);
  if (fireboy.alive) { ctx.fillStyle = fireboy.color; ctx.fillRect(fireboy.x, fireboy.y, fireboy.w, fireboy.h); ctx.fillStyle = '#fff'; ctx.fillRect(fireboy.x + 6, fireboy.y + 8, 5, 5); ctx.fillRect(fireboy.x + 13, fireboy.y + 8, 5, 5); }
  if (watergirl.alive) { ctx.fillStyle = watergirl.color; ctx.fillRect(watergirl.x, watergirl.y, watergirl.w, watergirl.h); ctx.fillStyle = '#fff'; ctx.fillRect(watergirl.x + 6, watergirl.y + 8, 5, 5); ctx.fillRect(watergirl.x + 13, watergirl.y + 8, 5, 5); }
  const statusEl = document.getElementById('gameStatus');
  if (levelComplete) { statusEl.textContent = '🎉 Level Complete! Moving to next level...'; statusEl.className = 'game-status success'; }
  else if (gameOver) { statusEl.textContent = '💀 Game Over! Press R to restart'; statusEl.className = 'game-status game-over'; }
  else statusEl.textContent = '';
  document.getElementById('levelDisplay').textContent = level;
  document.getElementById('scoreDisplay').textContent = score;
}
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
function askQuestion() {
  isAnswering = true;
  
  if (gameDifficulty === 'hard') {
    const answer = prompt(questionGate.question + "\n\nType your answer:");
    if (answer && answer.toLowerCase().trim() === questionGate.answer.toLowerCase().trim()) {
      alert("✅ Correct! Gate opened!");
      questionGate.passed = true;
      score += 100;
      if (typeof playGateOpen !== 'undefined') playGateOpen();
    } else {
      alert("❌ Wrong answer! The correct answer was: " + questionGate.answer);
    }
  } else {
    const answer = prompt(questionGate.question + "\n\n" + questionGate.options.map((opt, i) => (i + 1) + ". " + opt).join("\n"));
    if (parseInt(answer) - 1 === questionGate.answer) {
      alert("✅ Correct! Gate opened!");
      questionGate.passed = true;
      score += 50;
      if (typeof playGateOpen !== 'undefined') playGateOpen();
    } else {
      alert("❌ Wrong answer! Try again.");
    }
  }
  
  isAnswering = false;
}
function nextLevel() { level++; initLevel(level); }
function resetLevel() { initLevel(level); }
gameLoop();
