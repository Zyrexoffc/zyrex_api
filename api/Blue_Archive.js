const axios = require("axios");
const { Buffer } = require("buffer");

/* ======================
   CREATE IMAGE RESPONSE
====================== */
const createImageResponse = (buffer, filename = null) => {
  const headers = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  return new Response(buffer, { headers });
};

/* ======================
   SCRAPE RANDOM IMAGE
====================== */
async function getRandomBlueArchiveImage() {
  try {
    const GIST_URL =
      "https://gist.githubusercontent.com/siputzx/e985e0566c0529df3a2289fd64047d21/raw/1568d9d26ee25dbe82fb0bdf51b5c88727e3f602/bluearchive.json";

    const { data: images } = await axios.get(GIST_URL, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error("No image URLs found");
    }

    const randomImageUrl = images[Math.floor(Math.random() * images.length)];

    const imageResponse = await axios.get(randomImageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    return Buffer.from(imageResponse.data, "binary");
  } catch (e) {
    throw new Error("Failed to get random Blue Archive image: " + e.message);
  }
}

/* ======================
   ENDPOINT DEFINITION
====================== */
module.exports = [
  {
    name: "Random Blue Archive",
    desc: "Get random Blue Archive image",
    category: "Random",
    path: "/random/r/blue-archive?apikey=",

    async run(req, res) {
      const { apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid",
        });
      }

      try {
        const imageData = await getRandomBlueArchiveImage();
        return createImageResponse(imageData);
      } catch (e) {
        return res.status(500).json({
          status: false,
          error: e.message,
        });
      }
    },
  },
];
