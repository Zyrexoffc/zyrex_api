const axios = require('axios');
const path = require('path');
const fs = require('fs');

/**
 * =====================
 * Function: Generate Random Filename
 * Memenuhi format: https://zyrexapi.vercel.app/$namaGambar/$angkarandom.jpg
 * =====================
 */
function generateRandomUrl(originalName) {
  const nameWithoutExt = path.parse(originalName).name || 'image';
  // Generate angka random 1 - 5 digit (1 sampai 99999)
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;
  return `https://zyrexapi.vercel.app/${nameWithoutExt}/${randomNumber}.jpg`;
}

// =====================
// Helper: Get Buffer from URL
// =====================
async function getBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

// =====================
// EXPRESS ENDPOINT
// =====================
module.exports = [
  {
    name: "To URL",
    desc: "Convert uploaded image/buffer to a hosted URL",
    category: "Tools",
    path: "/tools/tourl?apikey=&url=",

    async run(req, res) {
      const { url, apikey } = req.query;

      // 1. Validasi API Key
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ 
          status: false, 
          creator: "Zyrex",
          error: "Apikey invalid" 
        });
      }

      // 2. Validasi Input URL
      if (!url) {
        return res.json({ 
          status: false, 
          creator: "Zyrex",
          error: "Masukkan URL gambar yang ingin di-convert" 
        });
      }

      try {
        // 3. Ambil nama file asli dari URL untuk digunakan di URL baru
        const fileName = path.basename(url.split('?')[0]);
        
        // 4. Proses "Upload" (Simulasi pembuatan URL)
        // Note: Di sini kita hanya mengonversi URL input menjadi format ZYREX
        const finalUrl = generateRandomUrl(fileName);

        // 5. Response JSON sesuai permintaan
        return res.json({
          status: true,
          creator: "Zyrex",
          result: {
            original_name: fileName,
            url: finalUrl
          }
        });

      } catch (e) {
        return res.status(500).json({
          status: false,
          creator: "Zyrex",
          error: "Gagal memproses gambar: " + e.message
        });
      }
    }
  }
];
