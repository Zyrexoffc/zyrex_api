const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://anonymsms.com';

async function getActiveNumbers() {
  try {
    const { data } = await axios.get(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const results = [];

    $('.card-num').each((index, element) => {
      const country = $(element).find('.country-name').text().trim() || 'Global';
      const number = $(element).find('.num-text').text().trim().replace(/\s+/g, '');
      const slug = $(element).find('a').attr('href');

      if (number && slug) {
        results.push({
          country,
          number,
          raw_number: number.replace(/[^0-9]/g, ''),
          path: slug // Nilai ini yang akan dikirim ke endpoint check-sms
        });
      }
    });

    return { total: results.length, numbers: results };
  } catch (err) {
    return { error: "Gagal mengambil daftar nomor aktif: " + err.message };
  }
}

module.exports = {
  name: "GetNumbers",
  desc: "Mengambil daftar nomor HP sementara dari berbagai negara yang siap pakai",
  category: "Tools",
  path: "/tools/get-numbers?apikey=", // Hanya butuh apikey

  async run(req, res) {
    const { apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      const result = await getActiveNumbers();
      if (result.error) return res.json({ status: false, error: result.error });

      res.json({
        status: true,
        result: result
      });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};
