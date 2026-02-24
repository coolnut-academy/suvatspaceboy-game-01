// ============================================================
// leaderboard.js — localStorage leaderboard
// ============================================================
const Leaderboard = {
    KEY: 'suvat_leaderboard',

    _read() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
        catch { return []; }
    },

    _write(data) {
        localStorage.setItem(this.KEY, JSON.stringify(data));
    },

    save(name, className, number, score, level) {
        const list = this._read();
        list.push({
            name, class: className, number, score, level,
            date: new Date().toLocaleDateString('th-TH')
        });
        list.sort((a, b) => b.score - a.score);
        this._write(list.slice(0, 50));          // keep top 50
    },

    getTop(n = 10) {
        return this._read().slice(0, n);
    },

    clear() { localStorage.removeItem(this.KEY); },

    renderHTML(limit = 10) {
        const list = this.getTop(limit);
        if (list.length === 0) return '<p class="lb-empty">ยังไม่มีข้อมูล</p>';
        return list.map((e, i) => `
            <div class="lb-row ${i < 3 ? 'lb-top' : ''}">
                <span class="lb-rank">${['🥇', '🥈', '🥉'][i] || (i + 1)}</span>
                <span class="lb-name">${e.name}</span>
                <span class="lb-score">${e.score} แต้ม</span>
                <span class="lb-level">Lv.${e.level}</span>
            </div>
        `).join('');
    }
};
