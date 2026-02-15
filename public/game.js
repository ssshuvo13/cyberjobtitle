// Game State
const gameState = {
    score: 0,
    stage: 0,
    timeLeft: 60,
    timerInterval: null,
    tiers: {},
    currentJob: null,
    foundCount: 0,
    jargonHits: 0,
    stageJargonHits: 0,
    totalCorrect: 0,
    isPlaying: false,
    playerName: null
};

// Grandma's stage reactions
const grandmaStageMessages = [
    "What does that mean, dear?",
    "Another one? What's that?",
    "These jobs sound so fancy!",
    "I'm starting to get it...",
    "One more? Tell me!"
];

// Friend message templates
const friendPrefixes = [
    "My friend said her daughter works as a",
    "My neighbor's son just got a job as a",
    "Did you hear? Lisa's kid is now a",
    "My coworker said his wife is a",
    "The lady next door said her son is a"
];

// Word size class (uniform)
const sizeClass = 'word-md';

// Cyber-themed name parts
const nameAdjectives = [
    'Shadow', 'Cyber', 'Neon', 'Digital', 'Quantum', 'Stealth', 'Phantom', 'Ghost',
    'Binary', 'Crypto', 'Neural', 'Rogue', 'Silent', 'Swift', 'Dark', 'Bright',
    'Electric', 'Frozen', 'Iron', 'Steel', 'Chrome', 'Pixel', 'Vector', 'Laser',
    'Turbo', 'Hyper', 'Ultra', 'Mega', 'Zero', 'Alpha', 'Beta', 'Omega',
    'Cosmic', 'Atomic', 'Sonic', 'Thunder', 'Storm', 'Blaze', 'Frost', 'Void'
];

const nameNouns = [
    'Hacker', 'Fox', 'Wolf', 'Hawk', 'Falcon', 'Tiger', 'Panther', 'Viper',
    'Dragon', 'Phoenix', 'Ninja', 'Samurai', 'Knight', 'Wizard', 'Sage', 'Oracle',
    'Hunter', 'Seeker', 'Runner', 'Rider', 'Walker', 'Watcher', 'Guardian', 'Sentinel',
    'Byte', 'Node', 'Core', 'Spark', 'Pulse', 'Wave', 'Storm', 'Blade',
    'Agent', 'Proxy', 'Ghost', 'Specter', 'Cipher', 'Coder', 'Decker', 'Netrunner'
];

// DOM Elements
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    endScreen: document.getElementById('end-screen'),
    startBtn: document.getElementById('start-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    score: document.getElementById('score'),
    finalScore: document.getElementById('final-score'),
    currentJobTitle: document.getElementById('current-job-title'),
    grandmaSpeech: document.getElementById('grandma-speech'),
    grandmaText: document.getElementById('grandma-text'),
    friendMessage: document.getElementById('friend-message'),
    grandmaFinalMessage: document.getElementById('grandma-final-message'),
    playerName: document.getElementById('player-name'),
    playerNameDisplay: document.getElementById('player-name-display'),
    tierDisplay: document.getElementById('tier-display'),
    stageDisplay: document.getElementById('stage-display'),
    foundDisplay: document.getElementById('found-display'),
    jargonHitsDisplay: document.getElementById('jargon-hits-display'),
    wordCloud: document.getElementById('word-cloud'),
    timer: document.getElementById('timer'),
    endTitle: document.getElementById('end-title'),
    endStages: document.getElementById('end-stages'),
    endCorrect: document.getElementById('end-correct'),
    endJargon: document.getElementById('end-jargon'),
    startLeaderboard: document.getElementById('start-leaderboard'),
    endLeaderboard: document.getElementById('end-leaderboard')
};

// Initialize game
async function init() {
    try {
        const jobTitlesResponse = await fetch('data/job-titles.json');
        const jobTitlesData = await jobTitlesResponse.json();
        gameState.tiers = jobTitlesData.tiers;

        initPlayerNameInput();
        setupEventListeners();
        loadLeaderboard(elements.startLeaderboard);
    } catch (error) {
        console.error('Failed to load game data:', error);
        alert('Failed to load game data. Please refresh the page.');
    }
}

// Generate a random cyber-themed name
function generateCyberName() {
    const adj = nameAdjectives[Math.floor(Math.random() * nameAdjectives.length)];
    const noun = nameNouns[Math.floor(Math.random() * nameNouns.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    return `${adj}${noun}${num}`;
}

// Set up the player name input with a random placeholder
function initPlayerNameInput() {
    const input = elements.playerName;
    if (!input) return;

    input.value = generateCyberName();

    input.addEventListener('focus', () => {
        if (!input.dataset.edited) {
            input.value = '';
        }
        input.select();
    });

    input.addEventListener('input', () => {
        input.dataset.edited = 'true';
    });

    input.addEventListener('blur', () => {
        if (input.value.trim() === '') {
            delete input.dataset.edited;
            input.value = generateCyberName();
        }
    });
}

// Get the current player name from input
function getPlayerName() {
    const input = elements.playerName;
    const name = input ? input.value.trim() : '';
    return name || generateCyberName();
}

// Update player name display in game header
function updatePlayerNameDisplay() {
    if (elements.playerNameDisplay) {
        elements.playerNameDisplay.textContent = gameState.playerName;
    }
}

// Set up event listeners
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.playAgainBtn.addEventListener('click', resetGame);
}

// Start the game
async function startGame() {
    gameState.playerName = getPlayerName();
    updatePlayerNameDisplay();

    // Shuffle each tier
    for (let tier = 1; tier <= 5; tier++) {
        if (gameState.tiers[tier]) {
            shuffleArray(gameState.tiers[tier]);
        }
    }

    // Reset state
    gameState.score = 0;
    gameState.stage = 0;
    gameState.timeLeft = 60;
    gameState.jargonHits = 0;
    gameState.totalCorrect = 0;
    gameState.isPlaying = true;

    updateScore();
    updateTimer();
    showScreen('game');
    nextStage();

    // Start timer
    gameState.timerInterval = setInterval(tick, 1000);
}

// Advance to next stage
function nextStage() {
    gameState.stage++;

    if (gameState.stage > 5) {
        endGame();
        return;
    }

    // Pick a random title from the current tier
    const tierTitles = gameState.tiers[gameState.stage];
    const randomIndex = Math.floor(Math.random() * tierTitles.length);
    gameState.currentJob = tierTitles[randomIndex];
    gameState.foundCount = 0;
    gameState.stageJargonHits = 0;

    // Update UI
    elements.tierDisplay.textContent = gameState.stage;
    elements.stageDisplay.textContent = `${gameState.stage}/5`;
    elements.foundDisplay.textContent = '0';
    elements.jargonHitsDisplay.textContent = '';

    // Set friend message and job title
    elements.friendMessage.textContent = friendPrefixes[gameState.stage - 1];
    elements.currentJobTitle.textContent = gameState.currentJob.title;

    // Set grandma message for this stage
    elements.grandmaText.textContent = grandmaStageMessages[gameState.stage - 1];
    elements.grandmaSpeech.classList.remove('happy');

    // Build word cloud
    buildWordCloud();
}

// Build the word cloud from current job's words
function buildWordCloud() {
    const job = gameState.currentJob;
    const words = [];

    // Add common words (correct answers)
    for (const word of job.common) {
        words.push({ text: word, type: 'common' });
    }

    // Add jargon words (traps)
    for (const word of job.jargon) {
        words.push({ text: word, type: 'jargon' });
    }

    // Shuffle all words
    shuffleArray(words);

    // Clear and build cloud
    elements.wordCloud.innerHTML = '';

    for (const word of words) {
        const btn = document.createElement('button');
        btn.className = `word-btn ${sizeClass}`;
        btn.textContent = word.text;
        btn.dataset.type = word.type;
        btn.dataset.word = word.text;
        btn.addEventListener('click', handleWordTap);
        elements.wordCloud.appendChild(btn);
    }
}

// Handle tapping a word
function handleWordTap(e) {
    const btn = e.currentTarget;

    // Ignore if game over or already tapped
    if (!gameState.isPlaying) return;
    if (btn.classList.contains('correct') || btn.classList.contains('disabled')) {
        return;
    }

    if (btn.dataset.type === 'common') {
        // Correct! Green glow, stays lit
        btn.classList.add('correct');
        gameState.foundCount++;
        gameState.totalCorrect++;
        gameState.score++;
        updateScore();
        elements.foundDisplay.textContent = gameState.foundCount;

        // Check if all 5 found
        if (gameState.foundCount >= 5) {
            // Stage complete!
            elements.grandmaText.textContent = 'Oh, now I understand!';
            elements.grandmaSpeech.classList.add('happy');

            // Disable remaining buttons
            const remaining = elements.wordCloud.querySelectorAll('.word-btn:not(.correct):not(.disabled)');
            for (const rem of remaining) {
                rem.classList.add('disabled');
            }

            // Short delay then advance
            setTimeout(() => {
                nextStage();
            }, 1200);
        }
    } else {
        // Jargon! Red flash, then grey
        btn.classList.add('wrong');
        gameState.jargonHits++;
        gameState.stageJargonHits++;
        gameState.score--;
        updateScore();
        updateJargonHitsDisplay();

        // Flash the game screen red
        elements.gameScreen.classList.add('screen-flash');
        setTimeout(() => {
            elements.gameScreen.classList.remove('screen-flash');
        }, 300);

        // After flash animation, disable the button
        setTimeout(() => {
            btn.classList.remove('wrong');
            btn.classList.add('disabled');
        }, 600);
    }
}

// Update score display
function updateScore() {
    elements.score.textContent = gameState.score;
}

// Update jargon hits display
function updateJargonHitsDisplay() {
    if (gameState.stageJargonHits > 0) {
        elements.jargonHitsDisplay.textContent = ` | ${gameState.stageJargonHits} jargon hit${gameState.stageJargonHits !== 1 ? 's' : ''}`;
    }
}

// Timer tick
function tick() {
    gameState.timeLeft--;
    updateTimer();

    if (gameState.timeLeft <= 0) {
        endGame();
    }
}

// Update timer display
function updateTimer() {
    elements.timer.textContent = gameState.timeLeft;

    if (gameState.timeLeft <= 10) {
        elements.timer.classList.add('warning');
    } else {
        elements.timer.classList.remove('warning');
    }
}

// End the game
async function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);

    // Update final stats
    elements.finalScore.textContent = gameState.score;
    elements.endStages.textContent = Math.min(gameState.stage - 1, 5);
    elements.endCorrect.textContent = gameState.totalCorrect;
    elements.endJargon.textContent = gameState.jargonHits;

    // Set end screen title and message
    const stagesCompleted = Math.min(gameState.stage - 1, 5);
    if (stagesCompleted >= 5) {
        elements.endTitle.textContent = 'Grandma Understands!';
        elements.grandmaFinalMessage.innerHTML = '<p>Now I understand what you do! Thank you, dear!</p>';
    } else if (gameState.timeLeft <= 0) {
        elements.endTitle.textContent = "Time's Up!";
        elements.grandmaFinalMessage.innerHTML = '<p>We ran out of time, dear! Let\'s try again!</p>';
    } else {
        elements.endTitle.textContent = 'Game Over';
        elements.grandmaFinalMessage.innerHTML = '<p>We\'ll figure it out next time, dear!</p>';
    }

    // Save to server
    try {
        await fetch('/api/game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName: gameState.playerName,
                score: gameState.score,
                jargonHits: gameState.jargonHits,
                stagesCompleted: stagesCompleted
            })
        });
    } catch (error) {
        console.error('Failed to save game:', error);
    }

    showScreen('end');
    loadLeaderboard(elements.endLeaderboard);
}

// Reset and play again
function resetGame() {
    showScreen('start');
    loadLeaderboard(elements.startLeaderboard);
}

// Show specific screen
function showScreen(screenName) {
    elements.startScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.endScreen.classList.remove('active');

    switch (screenName) {
        case 'start':
            elements.startScreen.classList.add('active');
            break;
        case 'game':
            elements.gameScreen.classList.add('active');
            break;
        case 'end':
            elements.endScreen.classList.add('active');
            break;
    }
}

// Fetch and render top 10 leaderboard + stats into a container
async function loadLeaderboard(container) {
    if (!container) return;
    try {
        const [lbResponse, statsResponse] = await Promise.all([
            fetch('/api/leaderboard?limit=10'),
            fetch('/api/stats')
        ]);
        const entries = await lbResponse.json();
        const stats = await statsResponse.json();
        renderLeaderboard(container, entries, stats);
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        container.innerHTML = '';
    }
}

function renderLeaderboard(container, entries, stats) {
    if (!entries || entries.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="lb"><h3 class="lb-title">Top 10</h3><div class="lb-table">';
    html += '<div class="lb-header"><span class="lb-rank">#</span><span class="lb-name">Player</span><span class="lb-score">Score</span></div>';

    entries.slice(0, 10).forEach((entry, i) => {
        const rank = i + 1;
        const rankClass = rank <= 3 ? ` lb-rank-${rank}` : '';
        const isMe = gameState.playerName && entry.player_name === gameState.playerName;
        const rowClass = isMe ? ' lb-row-me' : '';
        const name = entry.player_name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<div class="lb-row${rowClass}"><span class="lb-rank${rankClass}">${rank}</span><span class="lb-name">${name}</span><span class="lb-score">${entry.score}</span></div>`;
    });

    html += '</div>';

    if (stats) {
        html += '<div class="lb-stats">';
        html += `<span class="lb-stat">${stats.uniquePlayers} players</span>`;
        html += `<span class="lb-stat">${stats.totalGames} games</span>`;
        html += `<span class="lb-stat">avg ${stats.avgScore}</span>`;
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

// Fisher-Yates shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
