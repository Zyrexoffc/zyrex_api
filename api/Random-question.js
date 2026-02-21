const axios = require("axios");
const cheerio = require("cheerio");

/* ======================
   SCRAPE QUOTES ANIME
====================== */
async function getQuotesAnime() {
  try {
    const page = Math.floor(Math.random() * 184);
    const { data } = await axios.get("https://otakotaku.com/quote/feed/" + page, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const hasil = [];

    $("div.kotodama-list").each(function () {
      hasil.push({
        link: $(this).find("a").attr("href"),
        gambar: $(this).find("img").attr("data-src"),
        karakter: $(this).find("div.char-name").text().trim(),
        anime: $(this).find("div.anime-title").text().trim(),
        episode: $(this).find("div.meta").text().trim(),
        up_at: $(this).find("small.meta").text().trim(),
        quotes: $(this).find("div.quote").text().trim(),
      });
    });

    if (hasil.length === 0) {
      return [];
    }

    return hasil;
  } catch (e) {
    throw new Error("Gagal scrape quotes: " + e.message);
  }
}

/* ======================
   ENDPOINT STYLE
====================== */
module.exports = [
  {
    name: "Quotes Anime",
    desc: "Random anime quotes (scrape)",
    category: "Random",
    path: "/random/r/quotesanime?apikey=",

    async run(req, res) {
      const { apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid",
        });
      }

      try {
        const result = await getQuotesAnime();

        if (result.length === 0) {
          return res.json({
            status: false,
            error: "No quotes found",
          });
        }

        return res.json({
          status: true,
          data: result,
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
