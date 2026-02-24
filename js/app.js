// ============================================================
// app.js — Application controller (screens, events, state)
// ============================================================
const App = {
    score: 0,
    level: 1,
    bossRounds: 0,
    answerHistory: [],
    playerInfo: {},
    mode: 'practice',      // 'practice' | 'test'

    screens: {},
    statsModal: null,

    init() {
        // cache screens
        this.screens = {
            loading: document.getElementById('loading-screen'),
            start: document.getElementById('start-screen'),
            info: document.getElementById('info-screen'),
            game: document.getElementById('game-screen'),
            boss: document.getElementById('boss-screen'),
            learn: document.getElementById('learn-screen')
        };

        this.statsModal = document.getElementById('stats-modal');

        // preload assets then show start screen
        this._preload().then(() => {
            this._bindEvents();
            this._refreshLeaderboard();
            this.goTo('start');
        });
    },

    /* ─── asset preloading ─── */
    _preload() {
        const imgs = ['assets/images/cover.png', 'assets/images/player.png', 'assets/images/background.png'];
        const bar = document.getElementById('load-bar-fill');
        let loaded = 0;
        return new Promise(resolve => {
            if (imgs.length === 0) { resolve(); return; }
            imgs.forEach(src => {
                const img = new Image();
                img.onload = img.onerror = () => {
                    loaded++;
                    if (bar) bar.style.width = `${(loaded / imgs.length) * 100}%`;
                    if (loaded >= imgs.length) setTimeout(resolve, 400);
                };
                img.src = src;
            });
        });
    },

    /* ─── navigation ─── */
    goTo(name) {
        Object.values(this.screens).forEach(s => { if (s) s.style.display = 'none'; });
        if (this.screens[name]) this.screens[name].style.display = 'flex';
    },

    /* ─── event bindings ─── */
    _bindEvents() {
        // start screen buttons
        document.getElementById('practice-btn').onclick = () => {
            SoundManager.init();
            SoundManager.playClick();
            this.playerInfo = { name: 'นักฝึกวิทยายุทธ์อวกาศ', class: '', number: '' };
            this.mode = 'practice';
            this._resetState();
            this.goTo('game');
            this._startGame();
        };

        document.getElementById('test-btn').onclick = () => {
            SoundManager.init();
            SoundManager.playClick();
            this.goTo('info');
        };

        document.getElementById('learn-btn').onclick = () => {
            SoundManager.init();
            SoundManager.playClick();
            this.goTo('learn');
        };

        // info screen
        document.getElementById('play-game-btn').onclick = () => {
            const n = document.getElementById('fullname').value.trim();
            const c = document.getElementById('class').value.trim();
            const num = document.getElementById('number').value.trim();
            if (!n || !c || !num) { alert('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return; }
            this.playerInfo = { name: n, class: c, number: num };
            this.mode = 'test';
            this._resetState();
            this.goTo('game');
            this._startGame();
        };

        // back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.onclick = () => {
                SoundManager.playClick();
                this._saveIfNeeded();
                GameEngine.destroy();
                this.goTo('start');
                this._refreshLeaderboard();
                document.getElementById('game-container').classList.remove('paused');
            };
        });

        // warp
        const handleWarp = () => {
            SoundManager.playWarp();
            const gc = document.getElementById('game-container');
            if (gc.classList.contains('turbo-warp')) return;
            gc.classList.add('turbo-warp');
            document.querySelectorAll('.control-btn').forEach(b => b.disabled = true);
            setTimeout(() => {
                GameEngine.destroy();
                gc.classList.remove('turbo-warp');
                document.querySelectorAll('.control-btn').forEach(b => b.disabled = false);
                this.goTo('boss');
                this._startBoss();
            }, 1500);
        };

        document.getElementById('turbo-warp-btn').onclick = handleWarp;
        window.addEventListener('keydown', e => {
            if (e.key === 'Enter' && document.getElementById('turbo-warp-btn').style.display !== 'none') {
                handleWarp();
            }
        });

        // stats / pause
        document.getElementById('stats-btn').onclick = () => this._showStats();
        document.getElementById('resume-game-btn').onclick = () => this._hideStats();

        // sound toggle
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            soundBtn.onclick = () => {
                const on = SoundManager.toggle();
                soundBtn.textContent = on ? '🔊' : '🔇';
            };
        }

        // leaderboard toggle
        const lbBtn = document.getElementById('lb-toggle-btn');
        const lbPanel = document.getElementById('leaderboard-panel');
        if (lbBtn && lbPanel) {
            lbBtn.onclick = () => {
                lbPanel.classList.toggle('open');
                this._refreshLeaderboard();
            };
        }
    },

    /* ─── state ─── */
    _resetState() {
        this.score = 0;
        this.level = 1;
        this.bossRounds = 0;
        this.answerHistory = [];
        this._updateScoreUI();
    },

    _updateScoreUI() {
        const g = document.getElementById('score-display');
        const b = document.getElementById('score-display-boss');
        const l = document.getElementById('level-display');
        if (g) g.textContent = `คะแนน: ${this.score}`;
        if (b) b.textContent = `คะแนน: ${this.score}`;
        if (l) l.textContent = `Lv.${this.level}`;
    },

    _checkLevelUp() {
        const newLevel = Math.floor(this.score / 3) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            SoundManager.playLevelUp();
            // level-up particles will fire in game
        }
        this._updateScoreUI();
    },

    _saveIfNeeded() {
        if (this.score > 0) {
            Leaderboard.save(
                this.playerInfo.name,
                this.playerInfo.class,
                this.playerInfo.number,
                this.score,
                this.level
            );
        }
    },

    /* ─── game ─── */
    _startGame() {
        this._updateScoreUI();
        GameEngine.init(
            document.getElementById('gameCanvas'),
            document.getElementById('game-container'),
            document.getElementById('formula-display'),
            this.level
        );
    },

    /* ─── boss ─── */
    _startBoss() {
        this._updateScoreUI();
        BossFight.init(this.level, this.score, () => {
            this.bossRounds++;
            this._checkLevelUp();
            this.goTo('game');
            this._startGame();
        });
    },

    /* ─── stats modal ─── */
    _showStats() {
        GameEngine.pause();
        const info = document.getElementById('stats-player-info');
        let html = this.playerInfo.class
            ? `ผู้เล่น: ${this.playerInfo.name}<br>ชั้น: ${this.playerInfo.class} เลขที่: ${this.playerInfo.number}`
            : this.playerInfo.name;
        html += `<br><b style="color:#FFD700">คะแนน: ${this.score}  |  Level ${this.level}</b>`;
        info.innerHTML = html;

        const hc = document.getElementById('stats-history-container');
        hc.innerHTML = '';
        if (this.answerHistory.length === 0) {
            hc.innerHTML = '<p>ยังไม่มีประวัติการตอบคำถาม</p>';
        } else {
            this.answerHistory.slice().reverse().forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                const sc = item.isCorrect ? 'status-correct' : 'status-incorrect';
                const st = item.isCorrect ? '✅ ถูกต้อง' : '❌ ผิด';
                div.innerHTML = `
                    <p><b>คำถาม:</b> ${item.question}</p>
                    <p><b>คำตอบของคุณ:</b> ${item.yourAnswer || '-'}</p>
                    <p class="${sc}"><b>ผลลัพธ์:</b> ${st}</p>`;
                hc.appendChild(div);
            });
        }
        this.statsModal.style.display = 'flex';
    },

    _hideStats() {
        this.statsModal.style.display = 'none';
        GameEngine.resume();
    },

    /* ─── leaderboard ─── */
    _refreshLeaderboard() {
        const container = document.getElementById('lb-list');
        if (container) container.innerHTML = Leaderboard.renderHTML(10);
    }
};

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', () => App.init());
