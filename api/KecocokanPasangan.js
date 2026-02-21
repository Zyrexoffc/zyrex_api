const axios = require("axios");
const cheerio = require("cheerio");

/* ======================
   SCRAPE FUNCTION
====================== */
async function scrape(nama1, nama2) {
  try {
    const { data: html } = await axios.get(
      `https://primbon.com/kecocokan_nama_pasangan.php?nama1=${encodeURIComponent(
        nama1
      )}&nama2=${encodeURIComponent(nama2)}&proses=+Submit%21+`,
      {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    const $ = cheerio.load(html);
    const fetchText = $("#body").text();

    try {
      return {
        nama_anda: nama1,
        nama_pasangan: nama2,
        sisi_positif: fetchText
          .split("Sisi Positif Anda: ")[1]
          .split("Sisi Negatif Anda: ")[0]
          .trim(),
        sisi_negatif: fetchText
          .split("Sisi Negatif Anda: ")[1]
          .split("< Hitung Kembali")[0]
          .trim(),
        gambar: "https://primbon.com/ramalan_kecocokan_cinta2.png",
        catatan:
          "Kecocokan bisa dipadukan dengan ramalan jodoh Jawa/Bali dan numerologi cinta untuk hasil lebih luas.",
      };
    } catch (e) {
      return {
        status: false,
        message: "Error, kemungkinan input tidak valid",
      };
    }
  } catch (e) {
    throw new Error("Failed to fetch compatibility data: " + e.message);
  }
}

/* ======================
   ENDPOINT GET
====================== */
module.exports = [
  {
    name: "Kecocokan Nama Pasangan",
    desc: "Cek kecocokan nama pasangan (Primbon)",
    category: "Fun",
    path: "/fun/primbon/kecocokan_nama_pasangan?apikey=",

    /* METADATA PARAMETERS */
    parameters: [
      {
        name: "nama1",
        in: "query",
        required: true,
        description: "Nama pertama",
        example: "putu",
      },
      {
        name: "nama2",
        in: "query",
        required: true,
        description: "Nama kedua",
        example: "keyla",
      },
    ],

    async run(req, res) {
      const { apikey, nama1, nama2 } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!nama1 || typeof nama1 !== "string" || nama1.trim().length === 0) {
        return res.json({ status: false, error: "Parameter 'nama1' required" });
      }

      if (!nama2 || typeof nama2 !== "string" || nama2.trim().length === 0) {
        return res.json({ status: false, error: "Parameter 'nama2' required" });
      }

      try {
        const result = await scrape(nama1.trim(), nama2.trim());

        return res.json({
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        return res.status(500).json({ status: false, error: e.message });
      }
    },
  },
];
