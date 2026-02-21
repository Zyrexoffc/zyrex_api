const crypto = require("crypto");

/* ======================
   KHODAM DATA SOURCE
====================== */
const khodamList = [
  "🐉 Naga Kentut Sakti",
  "🐊 Buaya Pensiun",
  "🦖 T-Rex Kecapekan",
  "🦍 Gorila Overthinking",
  "🐧 Pinguin Nyasar",
  "🦅 Elang Insomnia",
  "🐌 Keong Turbo",
  "🐒 Monyet Depresi",
  "🦂 Kalajengking Introvert",
  "🐺 Serigala Alpha Gabut",
  "🐟 Lele Overpower",
  "🦄 Unicorn Batuk Darah",
  "🐲 Kadal Berotot",
  "🐑 Kambing Terbang",
  "🐫 Unta Multiverse",
  "🐍 Ular Gajebo Pro",
  "🦌 Rusa Gaming RGB",
  "🐸 Kodok Overheat",
  "🐷 Babi Ngepet 5G",
  "🦀 Kepiting Multitasking",
  "🦞 Lobster Sultan",
  "🐭 Tikus Kosan Hardcore",
  "🦙 Llama Barbar",
  "🐔 Ayam Berdasi Elite",
  "🦐 Udang Emo",
  "🦧 Orangutan Overpowered",
  "🐕 Anjing Laptop",
  "🐈 Kucing Hacker Pro",
  "🦦 Berang-berang Santuy",
  "🦑 Cumi Toxic",
  "🐦 Burung Intel",
  "🦈 Hiu Freelancer",
  "🐗 Babi Hutan Sigma",
  "🦓 Zebra Glitch",
  "🐢 Kura-Kura Speedrun",
  "🦅 Phoenix Reborn",
  "🐉 Naga Hitam Abyss",
  "🦁 Singa Dark Mode",
  "🐲 Dragon Cyber",
  "🦝 Rakun Maling Wifi",
  "🐊 Buaya Influencer",
  "🐸 Katak Quantum",
  "🐍 Python Error 404",
  "🦅 Garuda Multiverse",
  "🦖 Dino Sad Boy",
  "🐲 Dragon Plasma",
  "🦄 Unicorn Dark",
  "🐉 Naga API Gateway",
  "🐱 Kucing Syntax Error",
  "🐶 Anjing Debugger"
];

/* ======================
   RARITY SYSTEM
====================== */
const rarities = [
  { name: "Common", icon: "⚪", chance: 40 },
  { name: "Rare", icon: "🟢", chance: 30 },
  { name: "Epic", icon: "🔵", chance: 15 },
  { name: "Legendary", icon: "🟣", chance: 10 },
  { name: "Mythic", icon: "🟡", chance: 5 }
];

/* ======================
   UTILS
====================== */

// Hash dari nama biar hasil konsisten
function hashNama(nama) {
  return crypto.createHash("md5").update(nama).digest("hex");
}

// Ambil angka dari hash
function hashToNumber(hash) {
  return parseInt(hash.substring(0, 8), 16);
}

// Pick rarity berdasarkan chance
function pickRarity(seed) {
  let total = 0;
  const roll = seed % 100;

  for (let r of rarities) {
    total += r.chance;
    if (roll < total) return r;
  }

  return rarities[0];
}

/* ======================
   EXPORT ENDPOINT
====================== */
module.exports = [
  {
    name: "Cek Khodam",
    desc: "Cek khodam berdasarkan nama (Advanced System)",
    category: "Fun",
    path: "/fun/cekkhodam?apikey=&nama=",

    async run(req, res) {
      const { apikey, nama } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!nama) {
        return res.json({
          status: false,
          error: "Masukkan parameter nama"
        });
      }

      try {
        const hash = hashNama(nama.toLowerCase());
        const seed = hashToNumber(hash);

        const khodam = khodamList[seed % khodamList.length];
        const rarity = pickRarity(seed);
        const level = (seed % 100) + 1;
        const power = (seed % 9000) + 1000;

        return res.json({
          status: true,
          creator: "Zyrex Official",
          result: {
            nama: nama,
            khodam: khodam,
            rarity: `${rarity.icon} ${rarity.name}`,
            level: level,
            power: power,
            deskripsi: `Khodam ini memiliki level ${level} dengan kekuatan ${power}. Termasuk kategori ${rarity.name}.`,
            aura: power > 8000 ? "🔥 Aura Membara" :
                  power > 5000 ? "⚡ Aura Petir" :
                  power > 3000 ? "🌪️ Aura Angin" :
                  "🌫️ Aura Tipis"
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

const axios = require("axios");

/* ======================
HELPER FUNCTION
====================== */
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

/* ======================
EXPORT ENDPOINT
====================== */
module.exports = [
{
  name: "Quiz Game",
  desc: "Main quiz random dari internet",
  category: "fun",
  path: "/fun/quiz?apikey=&jawaban=",

  async run(req, res) {
    const { apikey, jawaban } = req.query;

    /* === APIKEY VALIDATION === */
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    try {

      /* === SCRAPE QUIZ API === */
      const response = await axios.get(
        "https://opentdb.com/api.php?amount=1&type=multiple"
      );

      const data = response.data;

      if (!data.results || data.results.length === 0) {
        return res.json({
          status: false,
          error: "Gagal mengambil soal"
        });
      }

      const quiz = data.results[0];

      const question = quiz.question
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");

      const correct = quiz.correct_answer;
      const options = shuffleArray([
        ...quiz.incorrect_answers,
        correct
      ]);

      /* =========================
         JIKA USER BELUM JAWAB
      ========================= */
      if (!jawaban) {
        return res.json({
          status: true,
          result: {
            soal: question,
            pilihan: options,
            info: "Kirim parameter &jawaban= untuk menjawab"
          }
        });
      }

      /* =========================
         CEK JAWABAN USER
      ========================= */
      const benar = jawaban.toLowerCase() === correct.toLowerCase();

      return res.json({
        status: true,
        result: {
          soal: question,
          jawaban_kamu: jawaban,
          jawaban_benar: correct,
          hasil: benar ? "🎉 Jawaban Benar!" : "❌ Jawaban Salah!"
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
