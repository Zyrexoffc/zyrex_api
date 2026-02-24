const axios = require("axios");
const cheerio = require("cheerio");

/* ======================
SCRAPE SOURCE
====================== */
async function scrapeJapanImage() {
  try {
    const { data } = await axios.get("https://www.pexels.com/search/japanese%20girl/", {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(data);
    const images = [];

    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("images.pexels.com")) {
        images.push(src);
      }
    });

    if (images.length === 0) {
      throw new Error("Gambar tidak ditemukan");
    }

    return images[Math.floor(Math.random() * images.length)];

  } catch (err) {
    throw new Error("Gagal scrape gambar");
  }
}

/* ======================
EXPORT ENDPOINT
====================== */
module.exports = [
  {
    name: "Random Cecan Japan",
    desc: "Scrape random Japanese girl image",
    category: "Random",
    path: "/random/cecanjapan?apikey=",

    async run(req, res) {
      const { apikey } = req.query;

      /* === APIKEY VALIDATION === */
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      try {
        const imageUrl = await scrapeJapanImage();

        return res.json({
          status: true,
          result: {
            image: imageUrl
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
