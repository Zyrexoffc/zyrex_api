const axios = require("axios");

/* ======================
MATCH ENGINE (SCRAPE STYLE)
====================== */
const hasilGame = ['goal', 'save', 'miss'];

function acakHasil() {
  return hasilGame[Math.floor(Math.random() * hasilGame.length)];
}

function getEmojiHasil(status) {
  if (status === 'goal') return '⚽️🥅 GOOOALLL!';
  if (status === 'save') return '🧤❌ Ditepis Kiper!';
  return '😓❌ Melenceng!';
}

/* ======================
EXPORT ENDPOINT
====================== */
module.exports = [
{
name: "Main Bola 2",
desc: "Simulasi duel bola 2 pemain",
category: "Fun",
path: "/fun/mainbola2?apikey=&nama1=&nama2=",

async run(req, res) {

const { apikey, nama1, nama2 } = req.query;

/* === APIKEY VALIDATION === */
if (!apikey || !global.apikey.includes(apikey)) {
  return res.json({
    status: false,
    error: "Apikey invalid"
  });
}

/* === PARAM VALIDATION === */
if (!nama1 || !nama2) {
  return res.json({
    status: false,
    error: "Masukkan parameter nama1 dan nama2"
  });
}

try {

/* ======================
SCRAPE SIMULATION
(Contoh ambil quote random biar ada feel scrape)
====================== */
let externalData = null;
try {
  const { data } = await axios.get("https://api.quotable.io/random", { timeout: 10000 });
  externalData = data.content;
} catch {
  externalData = "Pertandingan berlangsung sengit!";
}

/* ======================
GAME LOGIC
====================== */
const hasil1 = acakHasil();
const hasil2 = acakHasil();

let skor1 = hasil1 === 'goal' ? 1 : 0;
let skor2 = hasil2 === 'goal' ? 1 : 0;

let pemenang = "Seri 🤝";
if (skor1 > skor2) pemenang = nama1;
if (skor2 > skor1) pemenang = nama2;

/* ======================
RESPONSE
====================== */
return res.json({
  status: true,
  result: {
    pertandingan: `${nama1} vs ${nama2}`,
    komentar: externalData,
    hasil: {
      [nama1]: {
        aksi: getEmojiHasil(hasil1),
        skor: skor1
      },
      [nama2]: {
        aksi: getEmojiHasil(hasil2),
        skor: skor2
      }
    },
    pemenang: pemenang
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
