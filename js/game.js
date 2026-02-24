// ============================================================
// game.js — Main gameplay (8-dir movement, joystick, canvas)
// ============================================================
const GameEngine = {
    canvas: null, ctx: null, container: null, formulaDisplay: null,
    animationId: null, frame: 0, paused: false,
    player: null, stars: [], portal: null,
    currentFormula: null, targetVars: [], collected: [],
    level: 1, speed: 2,
    lastFormulaIdx: -1,
    scale: 1,               // responsive scale (1.0 = PC, ~0.55 = phone)
    onWarp: null,
    onScoreUpdate: null,
    _keys: {},              // keyboard state

    formulas: [
        { template: ['[v]', ' = ', '[u]', ' + ', '[a]', '[t]'], vars: ['v', 'u', 'a', 't'] },
        { template: ['[s]', ' = ', '[u]', '[t]', ' + ½', '[a]', '[t²]'], vars: ['s', 'u', 't', 'a', 't²'] },
        { template: ['[v²]', ' = ', '[u²]', ' + 2', '[a]', '[s]'], vars: ['v²', 'u²', 'a', 's'] },
        { template: ['[s]', ' = ½(', '[u]', '+', '[v]', ')', '[t]'], vars: ['s', 'u', 'v', 't'] }
    ],
    allVars: ['s', 'u', 'v', 'a', 't', 'u²', 'v²', 't²'],

    /* ─── joystick state ─── */
    _joy: { active: false, inputX: 0, inputY: 0, startX: 0, startY: 0, id: null },

    /* ─── init ─── */
    init(canvasEl, containerEl, formulaEl, level) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.container = containerEl;
        this.formulaDisplay = formulaEl;
        this.level = level || 1;
        this.frame = 0;
        this.stars = [];
        this.portal = null;
        this.paused = false;
        this._keys = {};
        this._joy = { active: false, inputX: 0, inputY: 0, startX: 0, startY: 0, id: null };
        this.speed = Math.min(5, 2 + (this.level - 1) * 0.4);

        this._resize();
        window.onresize = () => this._resize();

        // player — now supports X + Y movement, sizes scaled for device
        const sc = this.scale;
        this.player = {
            x: 80 * sc, y: this.canvas.height / 2,
            w: 180 * sc, h: 80 * sc, imgW: 200 * sc, imgH: 100 * sc,
            img: null, speedX: 0, speedY: 0
        };
        this.player.img = new Image();
        this.player.img.src = 'assets/images/player.png';

        this._bindControls();
        this.setupNewFormula();

        // start loop once image ready
        if (this.player.img.complete) this._loop();
        else this.player.img.onload = () => this._loop();
    },

    _resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        // Auto-scale: 800px wide = 1.0, smaller screens → smaller objects
        this.scale = Math.max(0.5, Math.min(1, this.canvas.width / 800));
        console.log('[SUVAT] canvas:', this.canvas.width, 'x', this.canvas.height, '→ scale:', this.scale.toFixed(2));
        // Keep player dimensions in sync with scale
        if (this.player) {
            const sc = this.scale;
            this.player.w = 180 * sc;
            this.player.h = 80 * sc;
            this.player.imgW = 200 * sc;
            this.player.imgH = 100 * sc;
        }
    },

    /* ═══════════ CONTROLS ═══════════ */

    _bindControls() {
        // ── Keyboard (PC) ──
        this._keydownHandler = e => {
            if (this.paused) return;
            this._keys[e.key] = true;
        };
        this._keyupHandler = e => {
            this._keys[e.key] = false;
        };
        window.addEventListener('keydown', this._keydownHandler);
        window.addEventListener('keyup', this._keyupHandler);

        // ── Virtual Joystick (Touch) ──
        const zone = document.getElementById('joystick-zone');
        const base = document.getElementById('joystick-base');
        const knob = document.getElementById('joystick-knob');
        if (!zone || !base || !knob) return;

        const maxDist = 37;     // max knob travel from center (px)

        const onStart = (cx, cy, id) => {
            const rect = base.getBoundingClientRect();
            this._joy.startX = rect.left + rect.width / 2;
            this._joy.startY = rect.top + rect.height / 2;
            this._joy.active = true;
            this._joy.id = id;
            knob.classList.add('active');
            this._joyMove(cx, cy, maxDist, knob);
        };
        const onMove = (cx, cy) => {
            if (!this._joy.active) return;
            this._joyMove(cx, cy, maxDist, knob);
        };
        const onEnd = () => {
            this._joy.active = false;
            this._joy.inputX = 0;
            this._joy.inputY = 0;
            this._joy.id = null;
            knob.classList.remove('active');
            knob.style.left = '50%';
            knob.style.top = '50%';
            knob.style.transform = 'translate(-50%, -50%)';
        };

        // Touch events
        zone.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.changedTouches[0];
            onStart(t.clientX, t.clientY, t.identifier);
        }, { passive: false });
        zone.addEventListener('touchmove', e => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                if (t.identifier === this._joy.id) {
                    onMove(t.clientX, t.clientY);
                    break;
                }
            }
        }, { passive: false });
        zone.addEventListener('touchend', e => {
            for (const t of e.changedTouches) {
                if (t.identifier === this._joy.id) { onEnd(); break; }
            }
        });
        zone.addEventListener('touchcancel', () => onEnd());

        // Mouse events (for testing on PC)
        zone.addEventListener('mousedown', e => {
            onStart(e.clientX, e.clientY, 'mouse');
        });
        window.addEventListener('mousemove', e => {
            if (this._joy.id === 'mouse') onMove(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', () => {
            if (this._joy.id === 'mouse') onEnd();
        });
    },

    _joyMove(cx, cy, maxDist, knob) {
        let dx = cx - this._joy.startX;
        let dy = cy - this._joy.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) { dx = dx / dist * maxDist; dy = dy / dist * maxDist; }
        // normalise -1 to 1
        this._joy.inputX = dx / maxDist;
        this._joy.inputY = dy / maxDist;
        // move knob visual
        knob.style.left = `calc(50% + ${dx}px)`;
        knob.style.top = `calc(50% + ${dy}px)`;
        knob.style.transform = 'translate(-50%, -50%)';
    },

    /* ═══════════ FORMULA ═══════════ */

    setupNewFormula() {
        this.portal = null;
        this.formulaDisplay.classList.remove('success');
        document.getElementById('turbo-warp-btn').style.display = 'none';
        const jz = document.getElementById('joystick-zone');
        if (jz) jz.style.display = '';      // show joystick

        let idx;
        do { idx = Math.floor(Math.random() * this.formulas.length); }
        while (idx === this.lastFormulaIdx);
        this.lastFormulaIdx = idx;

        this.currentFormula = this.formulas[idx];
        this.targetVars = this.currentFormula.vars;
        this.collected = [];
        this._renderFormula();
    },

    _renderFormula() {
        this.formulaDisplay.innerHTML = '';
        let vi = 0;
        this.currentFormula.template.forEach(part => {
            if (part.startsWith('[')) {
                const span = document.createElement('span');
                if (vi < this.collected.length) {
                    span.textContent = this.collected[vi];
                    span.className = 'filled';
                } else {
                    span.textContent = '?';
                    span.className = 'placeholder';
                }
                this.formulaDisplay.appendChild(span);
                vi++;
            } else {
                this.formulaDisplay.appendChild(document.createTextNode(part));
            }
        });
    },

    _handleCollect(star) {
        const target = this.targetVars[this.collected.length];
        if (star.letter === target) {
            this.collected.push(star.letter);
            this._renderFormula();
            SoundManager.playCollect();
            ParticleSystem.emitCollect(star.x, star.y);

            if (this.collected.length === this.targetVars.length) {
                this._formulaComplete();
            }
        } else {
            this.collected = [];
            this._renderFormula();
            SoundManager.playWrong();
            ParticleSystem.emitWrong(star.x, star.y);
            this.formulaDisplay.classList.add('fail');
            this.container.classList.add('screen-shake');
            setTimeout(() => {
                this.formulaDisplay.classList.remove('fail');
                this.container.classList.remove('screen-shake');
            }, 400);
        }
    },

    _formulaComplete() {
        SoundManager.playFormulaComplete();
        this.formulaDisplay.classList.add('success');
        ParticleSystem.emitComplete(this.canvas.width / 2, this.canvas.height / 2);

        const sc = this.scale;
        this.portal = {
            x: this.canvas.width - 80 * sc,
            y: Math.random() * (this.canvas.height - 100 * sc) + 50 * sc,
            size: 50 * sc, rot: 0
        };

        document.getElementById('turbo-warp-btn').style.display = 'inline-block';
        // keep joystick visible so player can still move toward portal
    },

    /* ═══════════ GAME OBJECTS ═══════════ */

    _spawnStar() {
        if (this.portal) return;
        const spawnInterval = Math.max(30, 75 - this.level * 5);
        if (this.frame % spawnInterval !== 0) return;

        let letter;
        const chance = Math.max(0.25, 0.45 - this.level * 0.02);
        if (Math.random() < chance) {
            letter = this.targetVars[this.collected.length];
        } else {
            letter = this.allVars[Math.floor(Math.random() * this.allVars.length)];
        }

        const sc = this.scale;
        this.stars.push({
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 50 * sc) + 10,
            size: 35 * sc, letter,
            speed: (this.speed + Math.random() * 2) * sc,
            glow: 0
        });
    },

    _drawStar(s) {
        const cx = s.x, cy = s.y, ctx = this.ctx;
        s.glow = (s.glow + 0.04) % (Math.PI * 2);
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10 + Math.sin(s.glow) * 5;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / 5;
        ctx.moveTo(cx, cy - s.size);
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(cx + Math.cos(rot) * s.size, cy + Math.sin(rot) * s.size);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * s.size * 0.5, cy + Math.sin(rot) * s.size * 0.5);
            rot += step;
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#1a0c2e';
        ctx.font = `bold ${Math.round(22 * this.scale)}px Kanit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.letter, cx, cy);
    },

    _updateStars() {
        this._spawnStar();
        const p = this.player;
        const px = p.x + (p.imgW - p.w) / 2;
        const py = p.y + (p.imgH - p.h) / 2;

        for (let i = this.stars.length - 1; i >= 0; i--) {
            const s = this.stars[i];
            s.x -= s.speed;
            this._drawStar(s);

            if (px < s.x + s.size && px + p.w > s.x - s.size &&
                py < s.y + s.size && py + p.h > s.y - s.size) {
                if (!this.portal) this._handleCollect(s);
                this.stars.splice(i, 1);
                continue;
            }
            if (s.x + s.size < 0) this.stars.splice(i, 1);
        }
    },

    _drawPortal() {
        if (!this.portal) return;
        const pt = this.portal, ctx = this.ctx;
        pt.rot += 0.05;
        ParticleSystem.emitPortalAmbient(pt.x, pt.y);

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        const g = ctx.createRadialGradient(0, 0, pt.size * 0.3, 0, 0, pt.size);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.4, '#ce93d8');
        g.addColorStop(0.7, '#9c27b0');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    /* ═══════════ PLAYER MOVEMENT (8 directions) ═══════════ */

    _updatePlayer() {
        const p = this.player;
        // Speed scales with screen so proportional movement feels equal
        const moveSpeed = 6 * this.scale;

        // Combine keyboard + joystick input
        let ix = 0, iy = 0;

        // Keyboard
        if (this._keys['ArrowLeft'] || this._keys['a'] || this._keys['A']) ix -= 1;
        if (this._keys['ArrowRight'] || this._keys['d'] || this._keys['D']) ix += 1;
        if (this._keys['ArrowUp'] || this._keys['w'] || this._keys['W']) iy -= 1;
        if (this._keys['ArrowDown'] || this._keys['s'] || this._keys['S']) iy += 1;

        // Joystick (analog, overrides if active)
        if (this._joy.active) {
            ix = this._joy.inputX;
            iy = this._joy.inputY;
        }

        // Normalise diagonal so it isn't faster
        const mag = Math.sqrt(ix * ix + iy * iy);
        if (mag > 1) { ix /= mag; iy /= mag; }

        p.x += ix * moveSpeed;
        p.y += iy * moveSpeed;

        // Bounds
        if (p.x < 0) p.x = 0;
        if (p.x > this.canvas.width - p.imgW) p.x = this.canvas.width - p.imgW;
        if (p.y < 0) p.y = 0;
        if (p.y > this.canvas.height - p.imgH) p.y = this.canvas.height - p.imgH;
    },

    _drawPlayer() {
        const p = this.player;
        if (!p.img.complete) return;
        this.ctx.drawImage(p.img, p.x, p.y, p.imgW, p.imgH);
    },

    /* ═══════════ MAIN LOOP ═══════════ */

    _loop() {
        if (this.paused) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._updatePlayer();
        this._drawPlayer();
        this._updateStars();
        this._drawPortal();
        ParticleSystem.update();
        ParticleSystem.draw(this.ctx);
        this.frame++;
        this.animationId = requestAnimationFrame(() => this._loop());
    },

    pause() {
        this.paused = true;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
        this.container.classList.add('paused');
    },

    resume() {
        this.paused = false;
        this.container.classList.remove('paused');
        this._loop();
    },

    destroy() {
        this.paused = true;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
        this.stars = [];
        this._keys = {};
        this._joy = { active: false, inputX: 0, inputY: 0, startX: 0, startY: 0, id: null };
        if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler);
        if (this._keyupHandler) window.removeEventListener('keyup', this._keyupHandler);
        ParticleSystem.clear();
    }
};
