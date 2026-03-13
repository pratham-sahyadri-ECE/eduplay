/**
 * script.js – Main Canvas 2D racing scene + WebSocket bridge handler
 * Math Racing – Smart Classroom Edition
 *
 * Depends on: audio.js, physics.js, game.js  (loaded before this file)
 */

// ── URL Params ──────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const CONFIG = {
    nameA: params.get('tA') || 'Team A',
    nameB: params.get('tB') || 'Team B',
    difficulty: params.get('diff') || 'medium',
    vehicle: params.get('veh') || 'car',
    avA: params.get('avA') || '👦',
    avB: params.get('avB') || '👧',
    classGrade: params.get('cls') || '5',
    raceLength: parseInt(params.get('len') || '10'),
    gameMode: 'car',
};

// ── Canvas Setup ────────────────────────────────────────────────────
const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resize);
resize();

// ── Game State & Vehicles ───────────────────────────────────────────
const GS = GameLogic.createGameState({
    difficulty: CONFIG.difficulty,
    raceLength: CONFIG.raceLength,
    nameA: CONFIG.nameA,
    nameB: CONFIG.nameB,
});
const carA = new Physics.Vehicle({ boostPower: 0.95, maxVel: 3.0 });
const carB = new Physics.Vehicle({ boostPower: 0.95, maxVel: 3.0 });

// ── Track Scroll State ──────────────────────────────────────────────
let bgScrollX = 0;
let roadMarkOffset = 0;

// ── Answer Input State ──────────────────────────────────────────────
let waitingForTeam = null;   // null | 'A' | 'B'  – for keyboard input
let answerDisplayMsg = '';
let answerDisplayTimer = 0;

// ── WebSocket ───────────────────────────────────────────────────────
let ws = null;
let wsConnected = false;

function connectWS() {
    try {
        ws = new WebSocket('ws://localhost:8765');
        ws.onopen = () => {
            wsConnected = true;
            setWsDot(true);
        };
        ws.onclose = () => {
            wsConnected = false;
            setWsDot(false);
            setTimeout(connectWS, 3000);
        };
        ws.onerror = () => { };
        ws.onmessage = (ev) => {
            const msg = ev.data.trim();
            // Expected format: "A:24" or "B:15"
            const match = msg.match(/^([AB]):(.+)$/i);
            if (match && GS.state === GameLogic.STATE.RACING && GS.currentQuestion) {
                const team = match[1].toUpperCase();
                const raw = match[2];
                handleAnswer(team, raw);
            }
        };
    } catch (e) { /* no WS */ }
}

function sendWS(cmd) {
    if (ws && wsConnected) {
        try { ws.send(cmd); } catch (e) { }
    }
}

function setWsDot(connected) {
    const dot = document.getElementById('wsDot');
    const txt = document.getElementById('wsStatus');
    if (!dot || !txt) return;
    dot.className = 'ws-dot ' + (connected ? 'connected' : 'disconnected');
    txt.textContent = connected ? 'ESP32 Connected' : 'No Hardware (keyboard mode)';
}

// ── Answer Handling ─────────────────────────────────────────────────
function handleAnswer(team, rawAnswer) {
    if (GS.state !== GameLogic.STATE.RACING) return;
    const result = GameLogic.validateAnswer(GS, team, rawAnswer);
    GameLogic.applyAnswer(GS, team, result.correct);

    if (result.correct) {
        AudioEngine.playEngineBoost();
        const car = team === 'A' ? carA : carB;
        car.boost();                // visual velocity burst
        car.directBoost(1 / 6);    // 6 correct answers = finish line 🏁
        Physics.triggerShake(6);
        showAnswerMsg(team, true, rawAnswer);
        sendWS(team === 'A' ? 'MOVE_A' : 'MOVE_B');
    } else {
        AudioEngine.playBuzz();
        showAnswerMsg(team, false, rawAnswer);
        sendWS(team === 'A' ? 'BUZZ_A' : 'BUZZ_B');
    }

    // Check victory
    setTimeout(() => {
        const w = GameLogic.checkVictory(GS, carA, carB);
        if (w) { triggerVictory(w); return; }
        // Ask next question after short delay
        setTimeout(showNextQuestion, 500);
    }, 200);
}

function showAnswerMsg(team, correct, ans) {
    const name = team === 'A' ? CONFIG.nameA : CONFIG.nameB;
    answerDisplayMsg = correct
        ? `✅ ${name} answered ${ans} — CORRECT! Boost! 🚀`
        : `❌ ${name} answered ${ans} — Wrong!`;
    answerDisplayTimer = 90;

    const el = document.getElementById('answerFeedback');
    if (el) {
        el.textContent = answerDisplayMsg;
        el.className = 'answer-feedback ' + (correct ? 'correct' : 'wrong');
        el.style.opacity = '1';
        setTimeout(() => { el.style.opacity = '0'; }, 1800);
    }
}

function showNextQuestion() {
    if (GS.state !== GameLogic.STATE.RACING) return;
    const q = GameLogic.nextQuestion(GS);
    updateQuestionUI(q);
    waitingForTeam = null;
}

function updateQuestionUI(q) {
    const el = document.getElementById('questionText');
    const na = document.getElementById('questionNum');
    if (el) el.textContent = q ? q.question : '';
    if (na) na.textContent = `Q${GS.questionNum + 1}`;
}

// ── Victory ─────────────────────────────────────────────────────────
function triggerVictory(winner) {
    GS.state = GameLogic.STATE.VICTORY;
    GS.winner = winner;
    GS.endTime = Date.now();
    AudioEngine.stopRaceAmbience();
    AudioEngine.playVictory();

    sendWS(winner === 'A' ? 'BUZZ_A' : 'BUZZ_B');
    setTimeout(() => sendWS('RESET'), 2500);

    const timeSecs = GS.startTime ? Math.round((GS.endTime - GS.startTime) / 1000) : null;
    const team = winner === 'A' ? GS.teamA : GS.teamB;
    const opp = winner === 'A' ? GS.teamB : GS.teamA;
    GameLogic.saveResult(
        { ...CONFIG, avA: CONFIG.avA, avB: CONFIG.avB, difficulty: CONFIG.difficulty },
        team, team.score, team.correct, GS.questionNum, timeSecs
    );
    GameLogic.saveResult(
        { ...CONFIG, avA: CONFIG.avA, avB: CONFIG.avB, difficulty: CONFIG.difficulty },
        opp, opp.score, opp.correct, GS.questionNum, null
    );

    // Show overlay
    const ov = document.getElementById('victoryOverlay');
    const nt = document.getElementById('victoryTeam');
    const sc = document.getElementById('victoryScores');
    if (ov && nt) {
        nt.textContent = (winner === 'A' ? CONFIG.nameA : CONFIG.nameB) + ' WINS!';
        nt.style.color = winner === 'A' ? '#00c6ff' : '#ff4e50';
        if (sc) sc.textContent = `Score: ${team.score} | Accuracy: ${GS.questionNum > 0 ? Math.round(team.correct / GS.questionNum * 100) : 0}%`;
        ov.classList.add('visible');
    }

    // Confetti
    const cCanvas = document.getElementById('confettiCanvas');
    if (cCanvas) {
        cCanvas.width = window.innerWidth;
        cCanvas.height = window.innerHeight;
        const confetti = new Physics.ConfettiSystem(cCanvas);
        confetti.start();
        setTimeout(() => confetti.stop(), 8000);
    }
}

// ── Countdown ────────────────────────────────────────────────────────
let countdownValue = 3;
function startCountdown() {
    GS.state = GameLogic.STATE.COUNTDOWN;
    const ov = document.getElementById('countdownOverlay');
    const num = document.getElementById('countdownNum');
    if (!ov || !num) { beginRace(); return; }

    ov.classList.add('visible');
    let count = 3;
    num.textContent = count;
    num.className = 'countdown-num neon-blue';
    AudioEngine.playCountdownBeep(440);

    const iv = setInterval(() => {
        count--;
        if (count > 0) {
            num.textContent = count;
            num.className = 'countdown-num neon-blue';
            // Force re-animation
            num.style.animation = 'none';
            void num.offsetWidth;
            num.style.animation = '';
            AudioEngine.playCountdownBeep(440);
        } else {
            clearInterval(iv);
            num.textContent = 'GO!';
            num.className = 'countdown-num neon-gold';
            num.style.animation = 'none';
            void num.offsetWidth;
            num.style.animation = '';
            AudioEngine.playGo();
            setTimeout(() => {
                ov.classList.remove('visible');
                beginRace();
            }, 700);
        }
    }, 900);
}

function beginRace() {
    GS.state = GameLogic.STATE.RACING;
    GS.startTime = Date.now();
    AudioEngine.startRaceAmbience();
    showNextQuestion();
}

// ── Renderer ─────────────────────────────────────────────────────────

function getVehicleEmoji() {
    const map = { car: '🚗', bike: '🏍️', buggy: '🚙', rocket: '🚀', truck: '🚛' };
    return map[CONFIG.vehicle] || '🚗';
}

function drawBackground() {
    const W = canvas.width, H = canvas.height;
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#0a0a2a');
    sky.addColorStop(1, '#1a1040');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.55);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 60; i++) {
        // Deterministic positions from index
        const sx = ((i * 137 + bgScrollX * 0.05) % W + W) % W;
        const sy = (i * 53) % (H * 0.5);
        const sr = (i % 3 === 0) ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }

    // Hills / distant silhouette
    ctx.fillStyle = '#1a0e3a';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.52);
    for (let x = 0; x <= W; x += 40) {
        const hillY = H * 0.44 + Math.sin((x + bgScrollX * 0.3) * 0.015) * 40 + Math.cos((x + bgScrollX * 0.2) * 0.025) * 25;
        ctx.lineTo(x, hillY);
    }
    ctx.lineTo(W, H * 0.55);
    ctx.lineTo(0, H * 0.55);
    ctx.closePath();
    ctx.fill();

    // Ground gradient
    const ground = ctx.createLinearGradient(0, H * 0.55, 0, H);
    ground.addColorStop(0, '#1e1e1e');
    ground.addColorStop(1, '#111');
    ctx.fillStyle = ground;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
}

function drawTrack(laneY, laneH) {
    const W = canvas.width;
    // Asphalt
    const asphalt = ctx.createLinearGradient(0, laneY, 0, laneY + laneH);
    asphalt.addColorStop(0, '#2d2d2d');
    asphalt.addColorStop(0.5, '#222');
    asphalt.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = asphalt;
    ctx.fillRect(0, laneY, W, laneH);

    // Lane edge lines
    ctx.strokeStyle = '#e8e000';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, laneY); ctx.lineTo(W, laneY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, laneY + laneH); ctx.lineTo(W, laneY + laneH); ctx.stroke();

    // Dashed center line
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 20]);
    ctx.beginPath();
    const midY = laneY + laneH / 2;
    ctx.moveTo(-roadMarkOffset % 50, midY);
    ctx.lineTo(W + 50, midY);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawStartFinish(x, laneY, laneH, label) {
    ctx.strokeStyle = label === 'FINISH' ? '#f9ca24' : '#00e676';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, laneY - 10);
    ctx.lineTo(x, laneY + laneH + 10);
    ctx.stroke();

    // Checkered pattern for finish
    if (label === 'FINISH') {
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 3; col++) {
                const bx = x + col * 10;
                const by = laneY + row * (laneH / 6);
                ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#000';
                ctx.fillRect(bx, by, 10, laneH / 6);
            }
        }
    }

    // Label
    ctx.font = 'bold 11px Orbitron, monospace';
    ctx.fillStyle = label === 'FINISH' ? '#f9ca24' : '#00e676';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + 15, laneY - 15);
}

function drawVehicle(car, x, y, color, avatar, label) {
    const W = canvas.width;
    ctx.save();

    // Boost glow
    if (car.isBoosting) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = color;
    }

    // Vehicle body – drawn as emoji + glow rect
    const bodyW = 70, bodyH = 36;
    const rx = x - bodyW / 2, ry = y - bodyH / 2;

    // Body rectangle
    const grad = ctx.createLinearGradient(rx, ry, rx, ry + bodyH);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(1, color + '66');
    ctx.fillStyle = grad;
    roundRect(ctx, rx, ry, bodyW, bodyH, 10);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, rx, ry, bodyW, bodyH, 10);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Avatar in cockpit
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(avatar, x, y - 3);

    // Wheels
    ctx.fillStyle = '#444';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    const wheelR = 10;
    const wheels = [
        { wx: x - bodyW * 0.32, wy: y + bodyH / 2 },
        { wx: x + bodyW * 0.32, wy: y + bodyH / 2 },
    ];
    for (const { wx, wy } of wheels) {
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(car.wheelAngle);
        ctx.beginPath();
        ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Spoke
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-wheelR + 3, 0); ctx.lineTo(wheelR - 3, 0);
        ctx.moveTo(0, -wheelR + 3); ctx.lineTo(0, wheelR - 3);
        ctx.stroke();
        ctx.restore();
    }

    // Boost flame
    if (car.isBoosting) {
        const flameX = rx - 12;
        const flameY = y;
        ctx.save();
        ctx.globalAlpha = 0.85;
        const flames = [
            { size: 18, color: '#fff', offsetY: 0 },
            { size: 14, color: '#ffe082', offsetY: 0 },
            { size: 10, color: '#ff6f00', offsetY: 0 },
        ];
        for (const f of flames) {
            const fg = ctx.createRadialGradient(flameX, flameY + f.offsetY, 1, flameX - f.size, flameY, f.size);
            fg.addColorStop(0, f.color);
            fg.addColorStop(1, 'transparent');
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.ellipse(flameX - f.size / 2, flameY, f.size, f.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // Team label
    ctx.fillStyle = color;
    ctx.font = 'bold 11px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.fillText(label, x, ry - 8);
    ctx.shadowBlur = 0;

    // Vehicles drive off dust
    car.emitDust(rx - 5, y + bodyH / 2 - 4);
    car.dustSystem.draw(ctx);

    ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawProgressBars() {
    const pA = Math.round(carA.progress * 100);
    const pB = Math.round(carB.progress * 100);
    document.getElementById('progA').style.width = pA + '%';
    document.getElementById('progB').style.width = pB + '%';
    document.getElementById('progALabel').textContent = `${CONFIG.nameA}: ${pA}%`;
    document.getElementById('progBLabel').textContent = `${CONFIG.nameB}: ${pB}%`;
    document.getElementById('scoreA').textContent = GS.teamA.score;
    document.getElementById('scoreB').textContent = GS.teamB.score;
}

// ── Audience drawers ──────────────────────────────────────────────
function drawAudience() {
    const W = canvas.width;
    const laneTop = canvas.height * 0.3;
    const emojis = ['🧑', '👩', '👦', '👧', '🧒', '👴', '👵', '🙋', '🙌'];
    ctx.font = '16px serif';
    for (let i = 0; i < 28; i++) {
        const ex = (i * 53 + bgScrollX * 0.08) % W;
        const ey = laneTop - 20 - (i % 3) * 18;
        ctx.fillText(emojis[i % emojis.length], ex, ey);
    }
}

// ── Game Loop ────────────────────────────────────────────────────────
let lastTime = 0;
function gameLoop(ts) {
    requestAnimationFrame(gameLoop);
    const dt = Math.min((ts - lastTime) / 16.67, 3);
    lastTime = ts;

    const W = canvas.width, H = canvas.height;

    // Update shake
    Physics.updateShake();

    ctx.save();
    ctx.translate(Physics.shake.x, Physics.shake.y);
    ctx.clearRect(-10, -10, W + 20, H + 20);

    // Background
    drawBackground();
    drawAudience();

    // Track layout – two lanes stacked
    const trackTop = H * 0.3;
    const trackTotal = H * 0.6;
    const laneH = trackTotal / 2 - 6;
    const laneAY = trackTop + 4;
    const laneBY = trackTop + laneH + 14;
    const usableW = W - 120;  // 60px start + 60px padding right
    const startX = 60;
    const finishX = W - 60;

    drawTrack(laneAY, laneH);
    drawTrack(laneBY, laneH);

    drawStartFinish(startX, laneAY, laneH, 'START');
    drawStartFinish(startX, laneBY, laneH, 'START');
    drawStartFinish(finishX, laneAY, laneH, 'FINISH');
    drawStartFinish(finishX, laneBY, laneH, 'FINISH');

    // Vehicle positions
    const carAX = startX + carA.progress * usableW;
    const carBX = startX + carB.progress * usableW;
    const carAY = laneAY + laneH * 0.5;
    const carBY = laneBY + laneH * 0.5;

    carA.x = carAX; carA.y = carAY;
    carB.x = carBX; carB.y = carBY;

    drawVehicle(carA, carAX, carAY, '#00c6ff', CONFIG.avA, CONFIG.nameA);
    drawVehicle(carB, carBX, carBY, '#ff4e50', CONFIG.avB, CONFIG.nameB);

    ctx.restore();

    if (GS.state === GameLogic.STATE.RACING) {
        bgScrollX += (carA.vel + carB.vel) * 2;
        roadMarkOffset += (carA.vel + carB.vel) * 2;
        carA.update(dt);
        carB.update(dt);

        // Auto-check victory each frame
        if (!GS.winner) {
            const w = GameLogic.checkVictory(GS, carA, carB);
            if (w) triggerVictory(w);
        }
    }

    drawProgressBars();
}

// ── Keyboard Input (fallback) ────────────────────────────────────────
const inputA = document.getElementById('inputA');
const inputB = document.getElementById('inputB');
const btnSubmitA = document.getElementById('submitA');
const btnSubmitB = document.getElementById('submitB');

function submitTeam(team) {
    if (GS.state !== GameLogic.STATE.RACING) return;
    const inp = team === 'A' ? inputA : inputB;
    const raw = inp.value.trim();
    if (!raw) return;
    handleAnswer(team, raw);
    inp.value = '';
    inp.focus();
}

if (btnSubmitA) btnSubmitA.addEventListener('click', () => submitTeam('A'));
if (btnSubmitB) btnSubmitB.addEventListener('click', () => submitTeam('B'));
if (inputA) inputA.addEventListener('keydown', e => { if (e.key === 'Enter') submitTeam('A'); });
if (inputB) inputB.addEventListener('keydown', e => { if (e.key === 'Enter') submitTeam('B'); });

// ── Mute Button ──────────────────────────────────────────────────────
const muteBtn = document.getElementById('muteBtn');
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        const m = !AudioEngine.isMuted();
        AudioEngine.setMuted(m);
        muteBtn.textContent = m ? '🔇' : '🔊';
    });
}

// ── Back Button ──────────────────────────────────────────────────────
const backBtn = document.getElementById('backBtn');
if (backBtn) backBtn.addEventListener('click', () => { window.location.href = 'setup.html'; });

const playAgainBtn = document.getElementById('playAgainBtn');
if (playAgainBtn) playAgainBtn.addEventListener('click', () => { window.location.href = 'setup.html'; });

const lbBtn = document.getElementById('lbBtn');
if (lbBtn) lbBtn.addEventListener('click', () => { window.location.href = 'leaderboard.html'; });

// ── Init ─────────────────────────────────────────────────────────────
document.getElementById('teamAName').textContent = CONFIG.nameA;
document.getElementById('teamBName').textContent = CONFIG.nameB;
document.getElementById('diffBadge').textContent = CONFIG.difficulty.toUpperCase();
document.getElementById('diffBadge').className = 'badge badge-' + CONFIG.difficulty;
setWsDot(false);

connectWS();
requestAnimationFrame(gameLoop);
startCountdown();
