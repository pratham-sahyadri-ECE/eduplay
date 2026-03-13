/**
 * physics.js – Vehicle physics, particle systems, camera shake
 * for Math Racing – Smart Classroom Edition
 */

const Physics = (() => {

    // ── Particle Pool ─────────────────────────────────────────────────
    class Particle {
        constructor() { this.reset(); this.life = 0; } // start dead
        reset(x = 0, y = 0, opts = {}) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * (opts.spreadX || 3);
            this.vy = -(Math.random() * (opts.upSpeed || 2) + 0.5);
            this.life = 1;
            this.decay = opts.decay || (0.02 + Math.random() * 0.02);
            this.size = opts.size || (4 + Math.random() * 6);
            this.color = opts.color || 'rgba(200,200,200,';
            this.gravity = opts.gravity || 0.08;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.vx *= 0.97;
            this.life -= this.decay;
        }
        draw(ctx) {
            if (this.life <= 0) return;
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color + Math.max(0, this.life) + ')';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        get alive() { return this.life > 0; }
    }

    class ParticleSystem {
        constructor(maxParticles = 80) {
            this.pool = Array.from({ length: maxParticles }, () => new Particle());
        }
        emit(x, y, count, opts) {
            let spawned = 0;
            for (const p of this.pool) {
                if (!p.alive) {
                    p.reset(x, y, opts);
                    if (++spawned >= count) break;
                }
            }
        }
        update() { this.pool.forEach(p => { if (p.alive) p.update(); }); }
        draw(ctx) { this.pool.forEach(p => { if (p.alive) p.draw(ctx); }); }
    }

    // ── Confetti System ──────────────────────────────────────────────
    class ConfettiSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.pieces = [];
            this.running = false;
            this.raf = null;
        }
        start() {
            this.pieces = [];
            this.running = true;
            for (let i = 0; i < 180; i++) {
                this.pieces.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * -this.canvas.height,
                    vx: (Math.random() - 0.5) * 4,
                    vy: 2 + Math.random() * 4,
                    rot: Math.random() * Math.PI * 2,
                    rotV: (Math.random() - 0.5) * 0.2,
                    w: 8 + Math.random() * 10,
                    h: 4 + Math.random() * 6,
                    color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 65%)`,
                    life: 1,
                    decay: 0.003 + Math.random() * 0.004,
                });
            }
            this._tick();
        }
        stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); }
        _tick() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.pieces = this.pieces.filter(p => p.life > 0);
            for (const p of this.pieces) {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.rotV;
                p.vx += (Math.random() - 0.5) * 0.2;
                p.life -= p.decay;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
            if (this.pieces.length > 0 && this.running) {
                this.raf = requestAnimationFrame(() => this._tick());
            } else {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    // ── Vehicle State ────────────────────────────────────────────────
    class Vehicle {
        constructor(opts = {}) {
            this.progress = 0;       // 0…1 race progress
            this.vel = 0;       // current velocity
            this.accel = 0;       // current acceleration impulse
            this.maxVel = opts.maxVel || 2.8;
            this.drag = opts.drag || 0.94;
            this.boostPower = opts.boostPower || 0.9;
            this.wheelAngle = 0;
            this.boostTimer = 0;       // frames remaining in boost
            this.dustSystem = new ParticleSystem(60);
            this.x = 0; this.y = 0;   // canvas draw coords (set by renderer)
        }

        boost() {
            this.vel = Math.min(this.vel + this.boostPower, this.maxVel);
            this.boostTimer = 28;
        }

        // Directly advance progress by a fixed fraction (e.g. 1/6 per correct answer)
        directBoost(amount) {
            this.progress = Math.min(this.progress + amount, 1);
        }

        update(dt = 1) {
            this.vel *= this.drag;
            this.progress += this.vel * 0.0018 * dt;
            this.progress = Math.min(this.progress, 1);
            this.wheelAngle += this.vel * 0.18;
            if (this.boostTimer > 0) this.boostTimer--;
            this.dustSystem.update();
        }

        emitDust(x, y) {
            if (this.vel > 0.3) {
                this.dustSystem.emit(x, y, 2, {
                    spreadX: 2,
                    upSpeed: 1.2,
                    decay: 0.03 + Math.random() * 0.02,
                    size: 3 + Math.random() * 4,
                    color: 'rgba(180,160,120,',
                    gravity: 0.04,
                });
            }
        }

        get isBoosting() { return this.boostTimer > 0; }
        get finished() { return this.progress >= 1; }
    }

    // ── Camera Shake ─────────────────────────────────────────────────
    const shake = { x: 0, y: 0, strength: 0 };

    function triggerShake(strength = 8) {
        shake.strength = strength;
    }

    function updateShake() {
        if (shake.strength > 0) {
            shake.x = (Math.random() - 0.5) * shake.strength;
            shake.y = (Math.random() - 0.5) * shake.strength;
            shake.strength *= 0.82;
            if (shake.strength < 0.3) shake.strength = 0;
        } else {
            shake.x = 0; shake.y = 0;
        }
    }

    return { Vehicle, ParticleSystem, ConfettiSystem, triggerShake, updateShake, shake };
})();
