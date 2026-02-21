const crypto = require("crypto");

/* ======================
   DATA MASTER
====================== */

const roles = [
  "Cyber Hacker Elite",
  "Mafia Teknologi Bawah Tanah",
  "Jenderal Pasukan Robot",
  "Ilmuwan Gila",
  "Penguasa Dark Web",
  "Raja Crypto Bangkrut",
  "Ninja Freelancer",
  "CEO Startup Gagal",
  "Alien Nyasar",
  "Pawang AI Overpowered"
];

const factions = [
  "Shadow Syndicate",
  "Neon Rebellion",
  "Quantum Order",
  "Digital Cult",
  "Meta Empire",
  "Chaos Corporation",
  "Cyber Legion",
  "Black Market Union"
];

const enemies = [
  "AI Ganas",
  "Teman Sendiri",
  "Mantan Toxic",
  "Pemerintah Rahasia",
  "Alien Invasion",
  "Kucing Hacker",
  "Bos Mafia",
  "Robot Pengkhianat"
];

const lifeEvents = [
  "Menemukan uang 1M crypto",
  "Dikhianati partner bisnis",
  "Menjadi buronan global",
  "Menang perang digital",
  "Kehilangan semua aset",
  "Diselamatkan hacker misterius",
  "Mendirikan kerajaan gelap",
  "Masuk penjara metaverse"
];

const endings = [
  "Hidup Kaya Tapi Parno",
  "Mati Misterius",
  "Jadi Legenda Internet",
  "Bangkrut Total",
  "Menghilang Tanpa Jejak",
  "Menjadi Penguasa Dunia",
  "Dijadikan Meme Seumur Hidup"
];

/* ======================
   HASH SEED GENERATOR
====================== */

function generateSeed(str) {
  const hash = crypto.createHash("sha256").update(str).digest("hex");
  return parseInt(hash.substring(0, 12), 16);
}

/* ======================
   SEEDED RANDOM
====================== */

function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function pickFromSeed(list, seedOffset) {
  const rand = seededRandom(seedOffset);
  return list[Math.floor(rand * list.length)];
}

/* ======================
   POWER CALCULATION
====================== */

function calculateDestinyScore(seed) {
  let base = seed % 1000;
  let modifier = (seed % 7) * 13;
  let chaos = (seed % 5) * 21;

  return (base + modifier + chaos) % 1000;
}

function tierRank(score) {
  if (score > 900) return "GOD TIER";
  if (score > 750) return "SSS TIER";
  if (score > 600) return "S TIER";
  if (score > 400) return "A TIER";
  if (score > 250) return "B TIER";
  return "C TIER (NPC Energy)";
}

/* ======================
   EXPORT MODULE
====================== */

module.exports = [
{
name: "Alternate Life Simulator",
desc: "Simulasi kehidupan di universe alternatif",
category: "Fun",
path: "/fun/altlife?apikey=&nama=&tgl=",

async run(req, res) {
const { apikey, nama, tgl } = req.query;

/* === APIKEY VALIDATION === */
if (!apikey || !global.apikey.includes(apikey)) {
  return res.json({ status: false, error: "Apikey invalid" });
}

/* === PARAM VALIDATION === */
if (!nama || !tgl) {
  return res.json({
    status: false,
    error: "Masukkan parameter nama & tgl (YYYY-MM-DD)"
  });
}

try {

  const seed = generateSeed(nama + tgl);

  const role = pickFromSeed(roles, seed + 1);
  const faction = pickFromSeed(factions, seed + 2);
  const enemy = pickFromSeed(enemies, seed + 3);
  const event1 = pickFromSeed(lifeEvents, seed + 4);
  const event2 = pickFromSeed(lifeEvents, seed + 5);
  const ending = pickFromSeed(endings, seed + 6);

  const destinyScore = calculateDestinyScore(seed);
  const tier = tierRank(destinyScore);

  return res.json({
    status: true,
    creator: "Zyrex official", 
    universe_id: seed,
    result: {
      nama: nama,
      tanggal_lahir: tgl,
      role: role,
      faction: faction,
      musuh_utama: enemy,
      peristiwa_besar: [event1, event2],
      ending_kehidupan: ending,
      destiny_score: destinyScore,
      tier: tier
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
