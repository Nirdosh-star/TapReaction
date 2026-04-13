/**
 * Tap Reaction Game | Final Build
 * Developer: Laxman Koirala
 */

console.log(
    "%c 🎯 Tap Reaction Game %c Laxman Koirala %c laxmankoirala7788@gmail.com ",
    "background: #bc13fe; color: #fff; padding: 5px; border-radius: 3px 0 0 3px; font-weight: bold;",
    "background: #00f2ff; color: #000; padding: 5px; font-weight: bold;",
    "background: #1e293b; color: #fff; padding: 5px; border-radius: 0 3px 3px 0;"
);

const state = {
    score: 0,
    timeLeft: 30,
    gameActive: false,
    highScore: localStorage.getItem('laxman_tap_high') || 0
};

const UI = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    over: document.getElementById('game-over-screen'),
    target: document.getElementById('target'),
    score: document.getElementById('current-score'),
    timer: document.getElementById('timer'),
    finalScore: document.getElementById('final-score'),
    menuHigh: document.getElementById('menu-high-score'),
    newRecord: document.getElementById('new-record'),
    playArea: document.getElementById('play-area')
};

UI.menuHigh.textContent = state.highScore;

function startGame() {
    state.score = 0;
    state.timeLeft = 30;
    state.gameActive = true;
    
    updateDisplay();
    switchScreen('game');
    moveTarget();
    
    const countdown = setInterval(() => {
        state.timeLeft--;
        UI.timer.textContent = `${state.timeLeft}s`;
        if (state.timeLeft <= 0) {
            clearInterval(countdown);
            endGame();
        }
    }, 1000);
}

function moveTarget() {
    const area = UI.playArea.getBoundingClientRect();
    const size = UI.target.offsetWidth;

    const maxX = area.width - size;
    const maxY = area.height - size;

    UI.target.style.left = `${Math.floor(Math.random() * maxX)}px`;
    UI.target.style.top = `${Math.floor(Math.random() * maxY)}px`;
    
    UI.target.animate([
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
    ], { duration: 150, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
}

function handleTap(e) {
    if (!state.gameActive) return;
    state.score++;
    UI.score.textContent = state.score.toString().padStart(2, '0');
    moveTarget();
}

function endGame() {
    state.gameActive = false;
    UI.finalScore.textContent = state.score;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('laxman_tap_high', state.highScore);
        UI.newRecord.style.display = 'block';
    } else {
        UI.newRecord.style.display = 'none';
    }
    
    UI.menuHigh.textContent = state.highScore;
    switchScreen('over');
}

function switchScreen(id) {
    [UI.start, UI.game, UI.over].forEach(s => s.classList.remove('active'));
    UI[id].classList.add('active');
}

function updateDisplay() {
    UI.score.textContent = "00";
    UI.timer.textContent = "30s";
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
UI.target.addEventListener('mousedown', handleTap);
UI.target.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTap(e);
});