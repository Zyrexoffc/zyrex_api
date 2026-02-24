const axios = require("axios");
const cheerio = require("cheerio");

/* ======================
SCRAPE SOURCE
====================== */
async function scrapeJapanImage() {
  try {
    {
    const GIST_URL = "https://raw.githubusercontent.com/siputzx/Databasee/refs/heads/main/cecan/japan.json";

    const { data: imageUrls } = await axios.get(GIST_URL, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error("No image URLs found in the GIST.");
    }

    const randomImageUrl =
      imageUrls[Math.floor(Math.random() * imageUrls.length)];

    const imageResponse = await axios.get(randomImageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    return Buffer.from(imageResponse.data, "binary");

  } catch (error) {
    console.error("API Error:", error.message);
    throw new Error("Failed to get random Japanese cecan image from API");
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
