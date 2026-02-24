// ============================================================
// boss.js — Boss-fight screen logic
// ============================================================
const BossFight = {
    emojis: ['👽', '👾', '🤖', '🎃', '👹', '🤡', '💀', '🛸', '☄️', '🌑'],
    lastIndices: [],

    init(level, score, onComplete) {
        const emojiEl = document.getElementById('boss-emoji');
        const questionEl = document.getElementById('boss-question');
        const mcqSect = document.getElementById('mcq-section');
        const fillSect = document.getElementById('fill-in-section');
        const answerBtns = document.querySelectorAll('.answer-btn');
        const fillInput = document.getElementById('fill-in-answer');
        const submitBtn = document.getElementById('submit-answer-btn');
        const bossScore = document.getElementById('score-display-boss');

        bossScore.textContent = `คะแนน: ${score}`;

        // pick 2 questions, avoid repeats
        const questions = QuestionGenerator.generate(2, this.lastIndices);
        this.lastIndices = questions.map(q => q._idx);

        let qNum = 0;

        const showQuestion = () => {
            fillInput.value = '';
            mcqSect.style.display = 'none';
            fillSect.style.display = 'none';

            if (qNum >= questions.length) {
                onComplete();
                return;
            }

            const q = questions[qNum];
            emojiEl.textContent = this.emojis[Math.floor(Math.random() * this.emojis.length)];
            questionEl.textContent = q.question;

            if (q.type === 'mcq') {
                mcqSect.style.display = 'block';
                answerBtns.forEach((btn, i) => {
                    btn.textContent = q.options[i];
                    btn.className = 'answer-btn';     // reset style
                    btn.disabled = false;
                    btn.onclick = () => handleAnswer(i === q.correctIndex, q.question, q.options[i]);
                });
            } else {
                fillSect.style.display = 'block';
                fillInput.focus();
                submitBtn.onclick = () => {
                    const val = Number(fillInput.value);
                    handleAnswer(Math.abs(val - q.answer) < 0.5, q.question, fillInput.value);
                };
            }
        };

        const handleAnswer = (isCorrect, questionText, yourAnswer) => {
            if (isCorrect) {
                score++;
                bossScore.textContent = `คะแนน: ${score}`;
                SoundManager.playBossCorrect();
            } else {
                SoundManager.playBossWrong();
            }

            // record history
            if (typeof App !== 'undefined') {
                App.answerHistory.push({ question: questionText, yourAnswer, isCorrect });
                App.score = score;
            }

            qNum++;

            // brief delay before next question
            setTimeout(showQuestion, 600);
        };

        showQuestion();
    }
};
