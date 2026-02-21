const axios = require("axios");

/* ======================
IN MEMORY DATABASE
====================== */

const playerDB = new Map();

/* ======================
GACHA CONFIG
====================== */

const GACHA_CONFIG = {
  costSingle: 100,
  costMulti: 900,
  pityEpic: 30,
  pityLegendary: 90,
  cooldown: 5000
};

/* ======================
GACHA DATA SOURCE
====================== */

const gachaPool = {
  Common: [
    { name: "🪨 Batu Biasa", type: "Material" },
    { name: "🪵 Kayu Lapuk", type: "Material" },
    { name: "🥄 Sendok Legendaris (palsu)", type: "Weapon" },
    { name: "🩴 Sendal Putus", type: "Armor" }
  ],
  Rare: [
    { name: "🗡️ Pedang Baja", type: "Weapon" },
    { name: "🛡️ Shield Guardian", type: "Armor" },
    { name: "🔥 Fire Scroll", type: "Magic" }
  ],
  Epic: [
    { name: "⚔️ Shadow Blade", type: "Weapon" },
    { name: "🧙 Staff Arcane", type: "Magic" },
    { name: "🐉 Dragon Fang", type: "Material" }
  ],
  Legendary: [
    { name: "👑 Crown of Kings", type: "Armor" },
    { name: "🔥 Inferno Blade", type: "Weapon" },
    { name: "🐲 Dragon Slayer EX", type: "Weapon" }
  ]
};

/* ======================
UTILITY
====================== */

function getPlayer(nama) {
  if (!playerDB.has(nama)) {
    playerDB.set(nama, {
      gold: 5000,
      pity: 0,
      totalPull: 0,
      inventory: [],
      history: [],
      lastPull: 0
    });
  }
  return playerDB.get(nama);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generatePower(rarity) {
  switch (rarity) {
    case "Common": return Math.floor(Math.random() * 20) + 5;
    case "Rare": return Math.floor(Math.random() * 40) + 20;
    case "Epic": return Math.floor(Math.random() * 80) + 50;
    case "Legendary": return Math.floor(Math.random() * 150) + 120;
  }
}

function getRarity(player) {
  player.pity++;

  if (player.pity >= GACHA_CONFIG.pityLegendary) {
    player.pity = 0;
    return "Legendary";
  }

  if (player.pity >= GACHA_CONFIG.pityEpic) {
    return "Epic";
  }

  const chance = Math.random() * 100;
  if (chance < 60) return "Common";
  if (chance < 85) return "Rare";
  if (chance < 97) return "Epic";
  return "Legendary";
}

/* ======================
GACHA EXECUTION
====================== */

function executePull(player) {
  const rarity = getRarity(player);
  const itemData = pickRandom(gachaPool[rarity]);
  const power = generatePower(rarity);

  const item = {
    name: itemData.name,
    type: itemData.type,
    rarity,
    power
  };

  player.inventory.push(item);
  player.history.unshift(item);
  player.totalPull++;

  if (rarity === "Legendary") {
    player.gold += 500; // bonus reward
  }

  return item;
}

/* ======================
EXPORT ENDPOINT
====================== */

module.exports = [
{
  name: "Advanced Gacha",
  desc: "Gacha RPG Advanced dengan pity & inventory",
  category: "Fun",
  path: "/fun/gacha?apikey=&nama=&type=",

  async run(req, res) {
    const { apikey, nama, type } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!nama) {
      return res.json({ status: false, error: "Masukkan parameter nama" });
    }

    const player = getPlayer(nama);

    if (Date.now() - player.lastPull < GACHA_CONFIG.cooldown) {
      return res.json({
        status: false,
        error: "Cooldown aktif, tunggu beberapa detik"
      });
    }

    const isMulti = type === "multi";
    const cost = isMulti ? GACHA_CONFIG.costMulti : GACHA_CONFIG.costSingle;

    if (player.gold < cost) {
      return res.json({
        status: false,
        error: "Gold tidak cukup"
      });
    }

    player.gold -= cost;
    player.lastPull = Date.now();

    try {
      let results = [];

      if (isMulti) {
        for (let i = 0; i < 10; i++) {
          results.push(executePull(player));
        }
      } else {
        results.push(executePull(player));
      }

      return res.json({
        status: true,
        result: {
          player: nama,
          gold_remaining: player.gold,
          total_pull: player.totalPull,
          pity_counter: player.pity,
          pull_type: isMulti ? "10x Multi Pull" : "Single Pull",
          items: results,
          inventory_size: player.inventory.length
        }
      });

    } catch (e) {
      return res.status(500).json({
        status: false,
        error: e.message
      });
    }
  }
}
];
