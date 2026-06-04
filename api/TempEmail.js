const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Fungsi untuk generate nama acak global berbasis kombinasi suku kata yang natural
 */
function generateGlobalRandomName() {
  const konsonan = 'bcdfghjklmnpqrstvwxyz';
  const vokal = 'aeiou';
  
  // Pilih panjang suku kata secara acak (antara 2 sampai 3 suku kata, misal: ro-bi atau a-ri-at)
  const jumlahSukuKata = Math.random() > 0.4 ? 2 : 3;
  let nama = '';

  for (let i = 0; i < jumlahSukuKata; i++) {
    // Pola standard suku kata: Konsonan + Vokal
    const kAcak = konsonan[Math.floor(Math.random() * konsonan.length)];
    const vAcak = vokal[Math.floor(Math.random() * vokal.length)];
    nama += kAcak + vAcak;
  }

  // Kadang-kadang tambahkan satu konsonan mati di paling akhir agar lebih variatif (misal: budi -> budin)
  if (Math.random() > 0.5) {
    const kMati = konsonan[Math.floor(Math.random() * konsonan.length)];
    // Hindari huruf mati ganda yang aneh di akhir seperti 'q' atau 'x'
    if (!['q', 'x', 'w', 'v', 'j'].includes(kMati)) {
      nama += kMati;
    }
  }

  // Tambahkan tepat 2 digit angka acak di belakang (10 - 99)
  const angkaAcak = Math.floor(10 + Math.random() * 90);
  
  return `${nama}${angkaAcak}`;
}

/**
 * Fungsi Utama TempMail
 */
async function handleTempMail() {
  // Ambil list domain aktif dari 1secmail
  const domains = await fetch('https://www.1secmail.com/api/v1/?action=getMessagesList')
    .then(r => r.json())
    .catch(() => ['1secmail.com', '1secmail.org', '1secmail.net']);

  const domainAcak = domains[Math.floor(Math.random() * domains.length)];
  
  // Ambil username hasil generate acak global
  const username = generateGlobalRandomName();
  const emailResult = `${username}@${domainAcak}`;

  return { 
    email: emailResult, 
    action: "generate" 
  };
}

module.exports = {
  name: "TempMail",
  desc: "Membuat email sementara dengan nama acak global tanpa batas dan 2 digit angka",
  category: "Tools",
  path: "/tools/tempmail?apikey=", 

  async run(req, res) {
    const { apikey } = req.query;

    // Validasi Apikey
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      const result = await handleTempMail();

      res.json({
        status: true,
        result: result
      });

    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};
