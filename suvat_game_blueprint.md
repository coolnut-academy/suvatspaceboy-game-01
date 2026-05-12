# 🚀 SUVAT Space Boy: Core Game Mechanics & Logic

เอกสารฉบับนี้สรุปโครงสร้างความเป็น "SUVAT Space Boy" ทั้งในส่วนของ Gameplay, Scoring Algorithm และ Randomization Logic เพื่อใช้เป็นพิมพ์เขียว (Blueprint) สำหรับการพัฒนาใหม่ใน Next.js + Vercel + Firebase

---

## 1. Core Gameplay Loop (วงจรการเล่น)

เกมแบ่งออกเป็น 2 เฟสหลักที่วนลูปต่อเนื่องกัน:

### 🛸 Phase 1: Exploration & Collection (เฟสเก็บดาว)
*   **เป้าหมาย:** เก็บตัวแปร ($s, u, v, a, t$) ให้ครบตามลำดับของสูตรฟิสิกส์ที่สุ่มขึ้นมา
*   **การควบคุม:** เคลื่อนที่ได้ 8 ทิศทาง (8-Way Movement) ทั้ง Keyboard (WASD/Arrows) และ Virtual Joystick
*   **สูตร SUVAT (4 สูตรหลัก):**
    1.  $v = u + at$ (เก็บ v, u, a, t)
    2.  $s = ut + \frac{1}{2}at^2$ (เก็บ s, u, t, a, t²)
    3.  $v^2 = u^2 + 2as$ (เก็บ v², u², a, s)
    4.  $s = \frac{1}{2}(u+v)t$ (เก็บ s, u, v, t)
*   **อุปสรรค:** 
    *   หากเก็บตัวแปรผิดลำดับ: สูตรจะ Reset ใหม่ทั้งหมด + หน้าจอสั่น (Screen Shake)
    *   ความเร็วของฉาก (Scroll Speed) จะเพิ่มขึ้นตาม Level ของผู้เล่น
*   **รางวัล:** เมื่อเก็บครบจะปรากฏ "Warp Portal" เพื่อข้ามไปยังเฟสถัดไป

### 👾 Phase 2: Boss Fight (เฟสตอบคำถาม)
*   **เป้าหมาย:** แก้โจทย์ฟิสิกส์ SUVAT จำนวน 2 ข้อ
*   **รูปแบบโจทย์:** 
    *   **MCQ (ปรนัย):** เลือกคำตอบที่ถูกต้องจาก 3 ตัวเลือก
    *   **Fill-in-the-blank (อัตนัย):** พิมพ์คำตอบเป็นตัวเลข (รองรับทศนิยม)
*   **รางวัล:** ทุกข้อที่ตอบถูกจะได้รับ +1 คะแนน และเมื่อตอบครบ 2 ข้อ จะกลับเข้าสู่เฟสเก็บดาวใหม่

---

## 2. Scoring & Progression Algorithm

*   **Scoring:** 
    *   คะแนนมาจากการตอบคำถามใน Phase Boss Fight เท่านั้น (+1 ต่อ 1 ข้อ)
    *   การเก็บดาวในฉากช่วยให้เข้าสู่ Boss Fight แต่ไม่ได้คะแนนโดยตรง
*   **Leveling System:** 
    *   สูตรคำนวณ: `Level = floor(Score / 3) + 1`
    *   **ผลกระทบของ Level:** 
        *   ความเร็วการเคลื่อนที่พื้นฐาน (Speed) เพิ่มขึ้น
        *   อัตราการเกิดของดาว (Spawn Interval) เร็วขึ้น
        *   โอกาสการสุ่มได้ตัวแปรที่ถูกต้อง (Target Spawn Chance) จะลดลงเล็กน้อย (ยากขึ้น)

---

## 3. Randomization & Generation Logic

### 🌟 Star Spawning (การสุ่มดาวในฉาก)
*   **Smart Random:** เกมไม่ได้สุ่มดาวมั่ว 100% แต่ใช้ระบบ "ถ่วงน้ำหนัก"
*   **Logic:**
    *   มีโอกาส $45\% - (Level \times 2\%)$ ที่จะสุ่มได้ **"ตัวแปรถัดไปที่ต้องเก็บ"**
    *   โอกาสที่เหลือจะสุ่มตัวแปรใดก็ได้จาก Pool ทั้งหมด ($s, u, v, a, t, u², v², t²$)
    *   วิธีนี้ช่วยให้เกมไม่ยากจนเกินไปในตอนต้น และท้าทายมากขึ้นเมื่อ Level สูงขึ้น

### 📝 Procedural Question Generator (การสร้างโจทย์อัตโนมัติ)
โจทย์ถูกสร้างขึ้นจาก 12 Templates ครอบคลุมทุกการหาค่าใน 4 สูตร SUVAT:

*   **ตัวอย่าง Logic การสร้างเลข:**
    *   **หา v:** สุ่ม $u \in [0, 8]$, $a \in [1, 5]$, $t \in [2, 8] \Rightarrow$ คำนวณ $v = u + at$
    *   **หา s (ตกอิสระ):** กำหนด $g=10$, สุ่ม $t \in [1, 5] \Rightarrow$ คำนวณ $s = 0.5 \times 10 \times t^2$
    *   **ความหน่วง (Deceleration):** สุ่ม $u$ และ $a$ ที่ทำให้ $v$ ไม่ติดลบ เพื่อให้โจทย์สมจริง
*   **Distractor Logic (ตัวลวง):** 
    *   ตัวเลือกที่ผิดจะถูกสร้างขึ้นโดยใช้ `คำตอบที่ถูก ± สุ่ม(1, 3)` เพื่อให้ตัวเลขใกล้เคียงกัน

---

## 4. Technical Blueprint for Next.js Rebuild

*   **State Management:** ใช้ `Zustand` หรือ `Redux` ในการเก็บ Score, Level และ Answer History
*   **Game Canvas:** ใช้ `HTML5 Canvas API` ร่วมกับ `requestAnimationFrame` ภายใต้ `useEffect` ของ React
*   **Database (Firebase):** 
    *   `Firestore`: เก็บ Leaderboard (Name, Class, Score, Level)
    *   `Auth`: รองรับ Anonymous Login หรือ Google Login สำหรับเก็บประวัติการเรียน
*   **Styling:** ใช้ `Vanilla CSS` หรือ `Framer Motion` สำหรับ Transitions ระหว่างหน้า (Warp Effect)

---

> [!TIP]
> **Key "Soul" of the Game:** คือการที่ผู้เล่นต้องจำสูตรให้ได้ก่อน (ผ่านการเก็บดาว) แล้วจึงนำสูตรนั้นไปประยุกต์ใช้แก้โจทย์จริง (Boss Fight) เป็นการเรียนรู้แบบ Active Learning ที่วนลูปอย่างเป็นระบบ
