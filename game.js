/**
 * game.js – Math question generator, answer evaluator, scoring,
 * game state machine, and leaderboard persistence.
 *
 * Math Racing – Smart Classroom Edition
 */

const GameLogic = (() => {

    // ── Question Generators ──────────────────────────────────────────

    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    function genEasy() {
        const op = Math.random() < 0.5 ? '+' : '-';
        const a = rand(1, 20);
        const b = rand(1, op === '+' ? 20 : a);
        const ans = op === '+' ? a + b : a - b;
        return { question: `${a} ${op} ${b} = ?`, answer: ans };
    }

    function genMedium() {
        const ops = ['+', '-', '×', '÷'];
        const op = ops[rand(0, 3)];
        let a, b, ans;
        switch (op) {
            case '+': a = rand(5, 50); b = rand(5, 50); ans = a + b; break;
            case '-': a = rand(10, 60); b = rand(1, a); ans = a - b; break;
            case '×': a = rand(2, 12); b = rand(2, 12); ans = a * b; break;
            case '÷': {
                b = rand(2, 12);
                ans = rand(2, 10);
                a = b * ans;
                break;
            }
        }
        return { question: `${a} ${op} ${b} = ?`, answer: ans };
    }

    function genHard() {
        const type = rand(0, 5);
        let question, answer;
        switch (type) {
            case 0: { // multiplication + addition
                const a = rand(2, 15), b = rand(2, 15), c = rand(1, 30);
                answer = a * b + c;
                question = `(${a} × ${b}) + ${c} = ?`;
                break;
            }
            case 1: { // square
                const a = rand(2, 15);
                answer = a * a;
                question = `${a}² = ?`;
                break;
            }
            case 2: { // square root (perfect)
                const roots = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
                const sq = roots[rand(0, roots.length - 1)];
                answer = Math.sqrt(sq);
                question = `√${sq} = ?`;
                break;
            }
            case 3: { // mixed with sqrt
                const roots = [4, 9, 16, 25, 36, 49, 64, 81, 100];
                const sq = roots[rand(0, roots.length - 1)];
                const a = rand(2, 12), b = rand(2, 12);
                answer = a * b + Math.sqrt(sq);
                question = `(${a} × ${b}) + √${sq} = ?`;
                break;
            }
            case 4: { // division + addition
                const b = rand(2, 10);
                const ans2 = rand(2, 12);
                const a = b * ans2;
                const c = rand(1, 20);
                answer = ans2 + c;
                question = `${a} ÷ ${b} + ${c} = ?`;
                break;
            }
            case 5: { // subtraction + multiplication
                const a = rand(5, 15), b = rand(2, 8), c = rand(2, 10);
                answer = a - b * c;
                question = `${a} − (${b} × ${c}) = ?`;
                break;
            }
        }
        return { question, answer };
    }

    // ── State Machine ────────────────────────────────────────────────
    const STATE = { IDLE: 'idle', COUNTDOWN: 'countdown', RACING: 'racing', PAUSED: 'paused', VICTORY: 'victory' };

    function createGameState(config) {
        return {
            state: STATE.IDLE,
            difficulty: config.difficulty || 'medium',
            raceLength: parseInt(config.raceLength || 10),
            teamA: { name: config.nameA || 'Team A', score: 0, correct: 0, wrong: 0 },
            teamB: { name: config.nameB || 'Team B', score: 0, correct: 0, wrong: 0 },
            currentQuestion: null,
            questionNum: 0,
            startTime: null,
            endTime: null,
            winner: null,
            answeredBy: null, // 'A' or 'B' for last answer
        };
    }

    function generateQuestion(difficulty) {
        switch (difficulty) {
            case 'easy': return genEasy();
            case 'hard': return genHard();
            case 'medium':
            default: return genMedium();
        }
    }

    /**
     * Validate an answer string against the current question.
     * Returns { correct: bool, team: 'A'|'B', answer: number }
     */
    function validateAnswer(gameState, team, rawAnswer) {
        const num = parseFloat(rawAnswer);
        if (isNaN(num)) return { correct: false, team };
        const correct = Math.abs(num - gameState.currentQuestion.answer) < 0.01;
        return { correct, team, answer: num };
    }

    function applyAnswer(gameState, team, correct) {
        const t = team === 'A' ? gameState.teamA : gameState.teamB;
        if (correct) {
            t.score++;
            t.correct++;
        } else {
            t.wrong++;
        }
        gameState.answeredBy = team;
        gameState.questionNum++;
    }

    function nextQuestion(gameState) {
        gameState.currentQuestion = generateQuestion(gameState.difficulty);
        return gameState.currentQuestion;
    }

    function checkVictory(gameState, vehicleA, vehicleB) {
        if (vehicleA.finished) { gameState.winner = 'A'; gameState.state = STATE.VICTORY; return 'A'; }
        if (vehicleB.finished) { gameState.winner = 'B'; gameState.state = STATE.VICTORY; return 'B'; }
        return null;
    }

    // ── Leaderboard ──────────────────────────────────────────────────
    const STORAGE_KEY = 'mathRacingLeaderboard';

    function saveResult(config, team, score, correct, total, timeSecs) {
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const entry = {
            name: team.name,
            avatar: config.avA || config.avB || '👤',
            vehicle: config.veh || '',
            score,
            accuracy,
            difficulty: config.difficulty || 'medium',
            gameMode: config.gameMode || 'car',
            timeSecs,
            timestamp: Date.now(),
        };
        const all = (() => {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
            catch { return []; }
        })();
        all.push(entry);
        // keep top 50
        all.sort((a, b) => b.score - a.score);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
    }

    return {
        STATE,
        createGameState,
        generateQuestion,
        validateAnswer,
        applyAnswer,
        nextQuestion,
        checkVictory,
        saveResult,
    };
})();
