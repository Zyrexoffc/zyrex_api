const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://anonymsms.com';

async function getSMSInbox(numberPath) {
  try {
    const targetUrl = numberPath.startsWith('http') ? numberPath : `${BASE_URL}${numberPath}`;
    
    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const messages = [];

    $('.messages-list-item, tr').each((index, element) => {
      const sender = $(element).find('.sender, td:nth-child(1)').text().trim();
      const content = $(element).find('.msg-body, td:nth-child(2)').text().trim();
      const time = $(element).find('.time, td:nth-child(3)').text().trim();

      if (sender && content) {
        messages.push({
          from: sender,
          message: content,
          received_at: time
        });
      }
    });

    return {
      total_messages: messages.length,
      messages: messages
    };
  } catch (err) {
    return { error: "Gagal memuat inbox nomor tersebut: " + err.message };
  }
}

module.exports = {
  name: "CheckSMS",
  desc: "Mengecek isi pesan SMS dan kode OTP yang masuk ke nomor sementara",
  category: "temp",
  path: "/temp/check-sms?apikey=&path=", // Masukkan path nomor dari fitur get-numbers

  async run(req, res) {
    const { apikey, path } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!path) {
      return res.json({ status: false, error: "Parameter 'path' wajib diisi untuk mengecek pesan" });
    }

    try {
      const result = await getSMSInbox(path);
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
