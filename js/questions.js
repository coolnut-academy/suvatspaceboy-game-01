// ============================================================
// questions.js — SUVAT question generator (12 templates)
// ============================================================
const QuestionGenerator = {

    _r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    _shuf(a) { return [...a].sort(() => Math.random() - 0.5); },

    /* ---------- helpers ---------- */
    _mcq(question, answer, unit, d1, d2) {
        const opts = this._shuf([answer, d1, d2]);
        return {
            type: 'mcq', question,
            options: opts.map(o => `${o} ${unit}`),
            correctIndex: opts.indexOf(answer),
            answer, unit
        };
    },
    _fill(question, answer, unit) {
        return { type: 'fill', question, answer, unit };
    },

    /* =============== Formula 1: v = u + at =============== */
    // find v
    q1() {
        const u = this._r(0, 8), a = this._r(1, 5), t = this._r(2, 8);
        const v = u + a * t;
        return this._mcq(
            `วัตถุเริ่มเคลื่อนที่ด้วยความเร็วต้น ${u} m/s ความเร่ง ${a} m/s² เป็นเวลา ${t} วินาที ความเร็วสุดท้ายเท่าใด?`,
            v, 'm/s', v + this._r(1, 3), v - this._r(1, 3));
    },
    // find u
    q2() {
        const u = this._r(2, 12), a = this._r(1, 4), t = this._r(2, 6);
        const v = u + a * t;
        return this._fill(
            `วัตถุเคลื่อนที่ด้วยความเร่ง ${a} m/s² เป็นเวลา ${t} วินาที มีความเร็วสุดท้าย ${v} m/s ความเร็วต้นเท่าใด?`,
            u, 'm/s');
    },
    // find a
    q3() {
        const u = this._r(0, 8), a = this._r(1, 5), t = this._r(2, 6);
        const v = u + a * t;
        return this._mcq(
            `วัตถุเปลี่ยนความเร็วจาก ${u} m/s เป็น ${v} m/s ในเวลา ${t} วินาที ความเร่งเท่าใด?`,
            a, 'm/s²', a + 1, a + 2);
    },
    // find t
    q4() {
        const u = this._r(0, 6), a = this._r(1, 4), t = this._r(2, 10);
        const v = u + a * t;
        return this._fill(
            `วัตถุเร่งจาก ${u} m/s ด้วยความเร่ง ${a} m/s² จนมีความเร็ว ${v} m/s ต้องใช้เวลากี่วินาที?`,
            t, 'วินาที');
    },

    /* =============== Formula 2: s = ut + ½at² ============= */
    // find s (general)
    q5() {
        const u = this._r(0, 4), a = this._r(2, 6), t = this._r(2, 4) * 2; // even t
        const s = u * t + 0.5 * a * t * t;
        return this._mcq(
            `วัตถุเริ่มด้วยความเร็ว ${u} m/s ความเร่ง ${a} m/s² เป็นเวลา ${t} วินาที เคลื่อนที่ได้กี่เมตร?`,
            s, 'เมตร', s + this._r(3, 8), s - this._r(3, 8));
    },
    // find s (free-fall u=0, g=10)
    q6() {
        const g = 10, t = this._r(1, 5);
        const s = 0.5 * g * t * t;
        return this._fill(
            `วัตถุตกอิสระ (g = 10 m/s²) เป็นเวลา ${t} วินาที ตกได้ระยะทางกี่เมตร?`,
            s, 'เมตร');
    },

    /* =============== Formula 3: v² = u² + 2as ============= */
    // find s  (avoid square-root for student)
    q7() {
        const u = this._r(2, 10), v = u + this._r(2, 8);
        const a = this._r(1, 4);
        const s = (v * v - u * u) / (2 * a);
        if (s !== Math.floor(s) || s <= 0) return this.q1(); // fallback
        return this._fill(
            `วัตถุเร่งจาก ${u} m/s เป็น ${v} m/s ด้วยความเร่ง ${a} m/s² ได้ระยะทางกี่เมตร?`,
            s, 'เมตร');
    },
    // find v²  (MCQ)
    q8() {
        const u = this._r(0, 6), a = this._r(2, 5), s = this._r(5, 15);
        const v2 = u * u + 2 * a * s;
        return this._mcq(
            `วัตถุเริ่มจาก ${u} m/s เร่งด้วย ${a} m/s² ระยะทาง ${s} เมตร ค่า v² เท่าใด?`,
            v2, 'm²/s²', v2 + this._r(5, 15), v2 - this._r(5, 15));
    },

    /* =============== Formula 4: s = ½(u+v)t =============== */
    // find s
    q9() {
        const u = this._r(0, 10), v = u + this._r(2, 16);
        const t = this._r(2, 8);
        const uv = u + v;
        const s = (uv % 2 === 0) ? (uv / 2) * t : uv * (t / 2);
        if (s !== Math.floor(s)) return this.q5(); // fallback
        return this._mcq(
            `วัตถุเคลื่อนที่ ${t} วินาที จากความเร็ว ${u} m/s เป็น ${v} m/s ได้ระยะทางกี่เมตร?`,
            s, 'เมตร', s + this._r(5, 15), s - this._r(5, 15));
    },
    // find t
    q10() {
        const u = this._r(2, 8), v = u + this._r(2, 10), t = this._r(2, 8);
        const s = 0.5 * (u + v) * t;
        if (s !== Math.floor(s)) return this.q4(); // fallback
        return this._fill(
            `วัตถุเปลี่ยนจาก ${u} m/s เป็น ${v} m/s ได้ระยะ ${s} เมตร ใช้เวลากี่วินาที?`,
            t, 'วินาที');
    },

    /* =============== Deceleration ========================= */
    q11() {
        const u = this._r(10, 30), decel = this._r(1, 4), t = this._r(2, 5);
        const v = u - decel * t;
        if (v < 0) return this.q1();
        return this._mcq(
            `รถเบรกจาก ${u} m/s ด้วยความหน่วง ${decel} m/s² เป็นเวลา ${t} วินาที ความเร็วสุดท้ายเท่าใด?`,
            v, 'm/s', v + this._r(1, 3), v - this._r(1, 3));
    },
    q12() {
        const decel = this._r(2, 5);
        const u = decel * this._r(2, 8);       // guarantees integer t
        const t = u / decel;
        return this._fill(
            `รถวิ่ง ${u} m/s เบรกด้วยความหน่วง ${decel} m/s² จนหยุดนิ่ง ใช้เวลากี่วินาที?`,
            t, 'วินาที');
    },

    /* ---------- public API ---------- */
    _generators: null,
    _allGen() {
        if (!this._generators) {
            this._generators = [
                () => this.q1(), () => this.q2(), () => this.q3(),
                () => this.q4(), () => this.q5(), () => this.q6(),
                () => this.q7(), () => this.q8(), () => this.q9(),
                () => this.q10(), () => this.q11(), () => this.q12()
            ];
        }
        return this._generators;
    },

    generate(count, excludeIndices = []) {
        const gens = this._allGen();
        const avail = gens.map((g, i) => i).filter(i => !excludeIndices.includes(i));
        const shuffled = this._shuf(avail).slice(0, count);
        return shuffled.map(i => ({ ...gens[i](), _idx: i }));
    }
};
