// ============================================================
// particles.js — Lightweight particle system for game effects
// ============================================================
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05;           // subtle gravity
        this.life--;
        this.size *= 0.97;
    }
    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    isDead() { return this.life <= 0 || this.size < 0.4; }
}

const ParticleSystem = {
    particles: [],

    _emit(x, y, count, colors, spdRange, sizeRange, lifeRange) {
        for (let i = 0; i < count; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = spdRange[0] + Math.random() * (spdRange[1] - spdRange[0]);
            this.particles.push(new Particle(
                x, y,
                Math.cos(ang) * spd,
                Math.sin(ang) * spd,
                colors[Math.floor(Math.random() * colors.length)],
                sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
                sizeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0])
            ));
        }
    },

    emitCollect(x, y) {
        this._emit(x, y, 14,
            ['#FFD700', '#FFA500', '#FFEC8B', '#fff'],
            [1, 4], [2, 5], [20, 40]);
    },

    emitWrong(x, y) {
        this._emit(x, y, 18,
            ['#f44336', '#ff5252', '#ff1744'],
            [2, 5], [2, 4], [15, 30]);
    },

    emitComplete(x, y) {
        this._emit(x, y, 28,
            ['#4CAF50', '#81C784', '#FFD700', '#fff'],
            [2, 6], [3, 7], [30, 55]);
    },

    emitLevelUp(w, h) {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * w;
            this.particles.push(new Particle(
                x, h + 10,
                (Math.random() - 0.5) * 3,
                -(3 + Math.random() * 5),
                ['#FFD700', '#FF6584', '#6C63FF', '#4CAF50', '#29B6F6'][Math.floor(Math.random() * 5)],
                3 + Math.random() * 5,
                40 + Math.random() * 40
            ));
        }
    },

    emitPortalAmbient(x, y) {
        if (Math.random() > 0.3) return;
        const ang = Math.random() * Math.PI * 2;
        const r = 30 + Math.random() * 20;
        this.particles.push(new Particle(
            x + Math.cos(ang) * r, y + Math.sin(ang) * r,
            -Math.cos(ang) * 0.5, -Math.sin(ang) * 0.5,
            ['#ce93d8', '#ba68c8', '#ab47bc', '#fff'][Math.floor(Math.random() * 4)],
            1 + Math.random() * 2, 20 + Math.random() * 20
        ));
    },

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) this.particles.splice(i, 1);
        }
    },

    draw(ctx) { this.particles.forEach(p => p.draw(ctx)); },

    clear() { this.particles = []; }
};
