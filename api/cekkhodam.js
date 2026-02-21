const axios = require("axios");

/* ======================
   KHODAM DATA SOURCE
====================== */
const khodamList = [
  '🐉 naga kentut sakti',
  '🐊 buaya pensiun',
  '🦖 t-rex kecapekan',
  '🦍 gorila stress',
  '🐧 pinguin nyasar',
  '🦅 elang insomnia',
  '🐌 keong turbo',
  '🐒 monyet depresi',
  '🦂 kalajengking pensiun',
  '🐺 serigala introvert',
  '🐟 lele sakti',
  '🦄 unicorn batuk',
  '🐲 kadal berotot',
  '🐑 kambing terbang',
  '🐫 unta gembel',
  '🐍 ular gajebo',
  '🦌 rusa gaming',
  '🐸 kodok sakau',
  '🐷 babi ngepet modern',
  '🦀 kepiting nyolong',
  '🦞 lobster sultan',
  '🐭 tikus kosan',
  '🦙 llama sange',
  '🐔 ayam berdasi',
  '🦐 udang emo',
  '🦧 orang utan baper',
  '🐒 kera sakti KW',
  '🐕 anjing laptop',
  '🐈 kucing hacker',
  '🦦 berang-berang stress',
  '🦑 cumi mabok',
  '🐦 burung kepo'
];

/* ======================
   RANDOM PICKER
====================== */
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* ======================
   EXPORT ENDPOINT
====================== */
module.exports = [
  {
    name: "Cek Khodam",
    desc: "Cek khodam berdasarkan nama",
    category: "Fun",
    path: "/fun/cekkhodam?apikey=&nama=",

    async run(req, res) {
      const { apikey, nama } = req.query;

      /* === APIKEY VALIDATION === */
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      /* === PARAM VALIDATION === */
      if (!nama) {
        return res.json({
          status: false,
          error: "Masukkan parameter nama"
        });
      }

      try {
        const khodam = pickRandom(khodamList);

        return res.json({
          status: true,
          result: {
            nama: nama,
            khodam: khodam,
            potensi: "Khodam ini ngeri bet 🔥"
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