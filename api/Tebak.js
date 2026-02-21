const axios = require("axios");

/* ======================
SESSION STORAGE
====================== */
const gameSession = new Map();

/* ======================
HELPER
====================== */
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function now() {
  return Date.now();
}

function pickRange(difficulty) {
  switch (difficulty) {
    case "easy":
      return { min: 1, max: 20, life: 5 };
    case "medium":
      return { min: 1, max: 50, life: 6 };
    case "hard":
      return { min: 1, max: 100, life: 7 };
    default:
      return { min: 1, max: 50, life: 6 };
  }
}

function generateHint(secret, guess) {
  const diff = Math.abs(secret - guess);

  if (diff === 0) return "🎯 PERFECT!";
  if (diff <= 3) return "🔥 PANAS BANGET!";
  if (diff <= 7) return "🌡️ ANGET";
  if (diff <= 15) return "❄️ DINGIN";
  return "🥶 BEKU";
}

/* ======================
EXPORT
====================== */
module.exports = [
{
name: "Tebak Angka Hardcore",
desc: "Game tebak angka full sistem",
category: "Fun",
path: "/fun/tebakangka?apikey=&action=&nama=&difficulty=&gameid=&guess=",

async run(req, res) {
const { apikey, action, nama, difficulty, gameid, guess } = req.query;

/* ======================
APIKEY VALIDATION
====================== */
if (!apikey || !global.apikey.includes(apikey)) {
  return res.json({
    status: false,
    error: "Apikey invalid"
  });
}

/* ======================
START GAME
====================== */
if (action === "start") {

  if (!nama) {
    return res.json({
      status: false,
      error: "Masukkan parameter nama"
    });
  }

  const range = pickRange(difficulty || "medium");
  const secret = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  const id = generateId();

  gameSession.set(id, {
    nama,
    secret,
    min: range.min,
    max: range.max,
    life: range.life,
    attempt: 0,
    xp: 0,
    streak: 0,
    createdAt: now()
  });

  return res.json({
    status: true,
    message: "Game dimulai!",
    game: {
      gameId: id,
      player: nama,
      difficulty: difficulty || "medium",
      range: `${range.min} - ${range.max}`,
      life: range.life,
      instruction: "Gunakan action=guess&gameid=ID&guess=angka"
    }
  });
}

/* ======================
GUESS SYSTEM
====================== */
if (action === "guess") {

  if (!gameid || !gameSession.has(gameid)) {
    return res.json({
      status: false,
      error: "Game tidak ditemukan / expired"
    });
  }

  const game = gameSession.get(gameid);

  if (!guess) {
    return res.json({
      status: false,
      error: "Masukkan angka tebakan"
    });
  }

  const userGuess = parseInt(guess);
  game.attempt++;

  /* EXPIRE CHECK (5 menit) */
  if (now() - game.createdAt > 300000) {
    gameSession.delete(gameid);
    return res.json({
      status: false,
      error: "Game expired"
    });
  }

  /* CORRECT */
  if (userGuess === game.secret) {
    const reward = (game.life * 10);
    game.xp += reward;
    game.streak++;

    gameSession.delete(gameid);

    return res.json({
      status: true,
      win: true,
      message: "🎉 ANGKA BENAR!",
      stats: {
        totalAttempt: game.attempt,
        xpEarned: reward,
        streak: game.streak
      }
    });
  }

  /* WRONG */
  game.life--;

  const hint = generateHint(game.secret, userGuess);

  if (game.life <= 0) {
    const answer = game.secret;
    gameSession.delete(gameid);

    return res.json({
      status: true,
      lose: true,
      message: "💀 NYAWA HABIS!",
      answer: answer
    });
  }

  return res.json({
    status: true,
    correct: false,
    hint: hint,
    remainingLife: game.life,
    attempt: game.attempt,
    direction: userGuess > game.secret ? "⬇️ Terlalu besar" : "⬆️ Terlalu kecil"
  });
}

/* ======================
CEK STATUS
====================== */
if (action === "status") {

  if (!gameid || !gameSession.has(gameid)) {
    return res.json({
      status: false,
      error: "Game tidak ditemukan"
    });
  }

  const game = gameSession.get(gameid);

  return res.json({
    status: true,
    data: {
      player: game.nama,
      range: `${game.min}-${game.max}`,
      life: game.life,
      attempt: game.attempt
    }
  });
}

/* ======================
INVALID ACTION
====================== */
return res.json({
  status: false,
  error: "Action tidak valid"
});

}
}
];
