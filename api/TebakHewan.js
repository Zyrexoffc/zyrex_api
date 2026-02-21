const axios = require("axios");
const cheerio = require("cheerio");

/* ======================
   SCRAPE FUNCTION
====================== */
async function scrape() {
  const page = Math.floor(Math.random() * 20) + 1;
  const url = `https://rimbakita.com/daftar-nama-hewan-lengkap/${page}/`;

  try {
    const { data: html } = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(html);
    const json = $("div.entry-content.entry-content-single img[class*=wp-image-][data-src]")
      .map((_, el) => {
        const src = $(el).attr("data-src");
        if (!src) return null;

        const titleMatch = src.split("/").pop();
        const title = titleMatch
          ? titleMatch.replace(/-/g, " ").replace(/\..+$/, "")
          : "Unknown Animal";

        return {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          url: src,
        };
      })
      .get()
      .filter(Boolean);

    if (json.length === 0) {
      throw new Error("No animals found");
    }

    return json;
  } catch (e) {
    throw new Error("Failed to fetch animal data: " + e.message);
  }
}

/* ======================
   ENDPOINT (SINGLE)
====================== */
module.exports = [
  {
    name: "Tebak Hewan",
    desc: "Game tebak hewan dari gambar",
    category: "Fun",
    path: "/fun/games/tebakhewan?apikey=",

    async run(req, res) {
      const { apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid",
        });
      }

      try {
        const data = await scrape();

        return res.json({
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        return res.status(500).json({
          status: false,
          error: e.message,
        });
      }
    },
  },
];
