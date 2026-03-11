const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi penyimpanan sementara (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB
}).single('image'); // Nama field saat upload adalah 'image'

// =====================
// Function: Generate Random Filename
// =====================
function generateZyrexUrl(originalName) {
  const nameWithoutExt = path.parse(originalName).name || 'zyrex_img';
  // Angka random 1 - 5 digit
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;
  return `https://zyrexapi.vercel.app/${nameWithoutExt}/${randomNumber}.jpg`;
}

// =====================
// EXPRESS ENDPOINT
// =
module.exports = [
  {
    name: "Upload to URL",
    desc: "Upload direct image and get Zyrex URL",
    category: "Tools",
    methode: "POST",
    path: "/tools/tourl", // Method harus POST untuk upload gambar

    async run(req, res) {
      // Gunakan multer untuk handle file upload
      upload(req, res, async (err) => {
        const { apikey } = req.query;

        // 1. Validasi API Key
        if (!apikey || !global.apikey.includes(apikey)) {
          return res.json({ 
            status: false, 
            creator: "Zyrex",
            error: "Apikey invalid" 
          });
        }

        if (err) {
          return res.json({ status: false, error: "Gagal upload: " + err.message });
        }

        // 2. Cek apakah ada file yang dikirim
        if (!req.file) {
          return res.json({ 
            status: false, 
            creator: "Zyrex",
            error: "Mana gambarnya? Kirim file dengan field 'image' (POST)" 
          });
        }

        try {
          // Di sini logikanya: Kamu punya buffer file di `req.file.buffer`
          // Jika ingin benar-benar tersimpan di Vercel/Server, kamu butuh database/Cloudinary.
          // Tapi sesuai permintaanmu untuk generate URL:
          
          const fileName = req.file.originalname;
          const finalUrl = generateZyrexUrl(fileName);

          // 3. Response JSON dengan URL hasil generate
          return res.json({
            status: true,
            creator: "Zyrex",
            result: {
              filename: fileName,
              mimetype: req.file.mimetype,
              size: `${(req.file.size / 1024).toFixed(2)} KB`,
              url: finalUrl
            }
          });

        } catch (e) {
          return res.status(500).json({
            status: false,
            creator: "Zyrex",
            error: "Internal Server Error: " + e.message
          });
        }
      });
    }
  }
];
