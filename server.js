const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize database
const db = new Database('/data/game.db');
db.exec(`
    CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        job_title TEXT NOT NULL,
        explanation TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
db.exec(`
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        jargon_hits INTEGER NOT NULL DEFAULT 0,
        stages_completed INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Adjectives and nouns for player names
const adjectives = [
    'Shadow', 'Cyber', 'Neon', 'Digital', 'Quantum', 'Stealth', 'Phantom', 'Ghost',
    'Binary', 'Crypto', 'Neural', 'Rogue', 'Silent', 'Swift', 'Dark', 'Bright',
    'Electric', 'Frozen', 'Iron', 'Steel', 'Chrome', 'Pixel', 'Vector', 'Laser',
    'Turbo', 'Hyper', 'Ultra', 'Mega', 'Zero', 'Alpha', 'Beta', 'Omega',
    'Cosmic', 'Atomic', 'Sonic', 'Thunder', 'Storm', 'Blaze', 'Frost', 'Void'
];

const nouns = [
    'Hacker', 'Fox', 'Wolf', 'Hawk', 'Falcon', 'Tiger', 'Panther', 'Viper',
    'Dragon', 'Phoenix', 'Ninja', 'Samurai', 'Knight', 'Wizard', 'Sage', 'Oracle',
    'Hunter', 'Seeker', 'Runner', 'Rider', 'Walker', 'Watcher', 'Guardian', 'Sentinel',
    'Byte', 'Node', 'Core', 'Spark', 'Pulse', 'Wave', 'Storm', 'Blade',
    'Agent', 'Proxy', 'Ghost', 'Specter', 'Cipher', 'Coder', 'Decker', 'Netrunner'
];

// Generate unique player name
app.get('/api/player', (req, res) => {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    const playerName = `${adjective}${noun}${number}`;
    res.json({ playerName });
});

// Submit a game result (new word cloud game)
app.post('/api/game', (req, res) => {
    const { playerName, score, jargonHits, stagesCompleted } = req.body;

    if (!playerName || score === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const stmt = db.prepare('INSERT INTO games (player_name, score, jargon_hits, stages_completed) VALUES (?, ?, ?, ?)');
        stmt.run(playerName, score, jargonHits || 0, stagesCompleted || 0);
        res.json({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save game' });
    }
});

// Get leaderboard (top games)
app.get('/api/leaderboard', (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 50);
        const rows = db.prepare(`
            SELECT player_name, score, jargon_hits, stages_completed, created_at
            FROM games
            ORDER BY score DESC, jargon_hits ASC, created_at DESC
            LIMIT ?
        `).all(limit);

        res.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get stats
app.get('/api/stats', (req, res) => {
    try {
        const totalGames = db.prepare('SELECT COUNT(*) as count FROM games').get().count;
        const uniquePlayers = db.prepare('SELECT COUNT(DISTINCT player_name) as count FROM games').get().count;
        const perfectGames = db.prepare('SELECT COUNT(*) as count FROM games WHERE score = 25').get().count;
        const avgScore = db.prepare('SELECT ROUND(AVG(score), 1) as avg FROM games').get().avg || 0;

        res.json({
            totalGames,
            uniquePlayers,
            perfectGames,
            avgScore
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Keep old endpoints for backward compatibility with existing data
app.get('/api/answers', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT job_title, explanation, player_name, created_at
            FROM answers
            ORDER BY job_title, created_at DESC
        `).all();

        const grouped = {};
        for (const row of rows) {
            if (!grouped[row.job_title]) {
                grouped[row.job_title] = [];
            }
            grouped[row.job_title].push({
                explanation: row.explanation,
                playerName: row.player_name,
                createdAt: row.created_at
            });
        }

        res.json(grouped);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch answers' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
