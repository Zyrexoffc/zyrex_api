const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Fungsi pembangkit nama acak global (2-3 suku kata + 2 digit angka)
 */
function generateGlobalRandomName() {
  const konsonan = 'bcdfghjklmnpqrstvwxyz';
  const vokal = 'aeiou';
  const jumlahSukuKata = Math.random() > 0.4 ? 2 : 3;
  let nama = '';

  for (let i = 0; i < jumlahSukuKata; i++) {
    nama += konsonan[Math.floor(Math.random() * konsonan.length)] + vokal[Math.floor(Math.random() * vokal.length)];
  }

  if (Math.random() > 0.5) {
    const kMati = konsonan[Math.floor(Math.random() * konsonan.length)];
    if (!['q', 'x', 'w', 'v', 'j'].includes(kMati)) nama += kMati;
  }

  const angkaAcak = Math.floor(10 + Math.random() * 90);
  return `${nama}${angkaAcak}`;
}

/**
 * Fungsi Utama: Menjamin email berformat nama orang DAN terdaftar aktif di server
 */
async function handleTempMail() {
  // 1. Ambil list domain resmi yang saat ini aktif di 1secmail
  const domains = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList')
    .then(r => r.json())
    .catch(() => ['1secmail.com', '1secmail.org', '1secmail.net']);

  const domainAcak = domains[Math.floor(Math.random() * domains.length)];
  
  // 2. Buat username nama orang acak global
  const username = generateGlobalRandomName();
  
  // 3. Jalankan pancingan ke server agar inbox-nya langsung aktif dan siap pakai
  await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${username}&domain=${domainAcak}`)
    .catch(() => {});

  return { 
    email: `${username}@${domainAcak}`, 
    action: "generate" 
  };
}

module.exports = {
  name: "TempMail",
  desc: "Membuat email sementara dengan nama acak global secara instan",
  category: "Tools",
  path: "/tools/tempmail?apikey=", // Cukup panggil apikey saja, tanpa parameter email

  async run(req, res) {
    const { apikey } = req.query;

    // Validasi Apikey bawaan sistem
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      // Langsung jalankan fungsi tanpa oper parameter email dari request
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
