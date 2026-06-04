const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Fungsi untuk mengambil atau membuat email baru dan mengecek inbox
 * Menggunakan API 1secmail (Gratis & Stabil)
 */
async function handleTempMail(email = null) {
  // Jika tidak ada email, generate email baru
  if (!email) {
    const res = await fetch('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1')
      .then(r => r.json())
      .catch(err => ({ error: err.message }));
    
    if (Array.isArray(res) && res.length > 0) {
      return { email: res[0], action: "generate" };
    }
    return { error: "Gagal membuat email baru" };
  }

  // Jika ada email, belah menjadi username dan domain
  const [login, domain] = email.split('@');
  if (!login || !domain) {
    return { error: "Format email tidak valid" };
  }

  // Ambil daftar pesan di inbox
  const messages = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`)
    .then(r => r.json())
    .catch(err => []);

  // Jika inbox kosong, langsung kembalikan array kosong
  if (!Array.isArray(messages) || messages.length === 0) {
    return { email, messages: [] };
  }

  // Ambil detail konten isi pesan untuk setiap email yang masuk (karena list bawaannya cuma subjek & pengirim)
  const detailedMessages = await Promise.all(
    messages.map(async (msg) => {
      const detail = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${msg.id}`)
        .then(r => r.json())
        .catch(() => null);
      return detail || msg;
    })
  );

  return {
    email,
    messages: detailedMessages
  };
}

module.exports = {
  name: "TempMail",
  desc: "Membuat email sementara atau mengecek inbox pesan masuk",
  category: "Tools",
  path: "/tools/tempmail?apikey=&email=", // Kosongkan email untuk generate baru, isi email untuk cek inbox

  async run(req, res) {
    const { email, apikey } = req.query;

    // Validasi Apikey sesuai struktur kodemu
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      // Jalankan fungsi temp mail
      const result = await handleTempMail(email);

      if (result.error) {
        return res.json({ status: false, error: result.error });
      }

      res.json({
        status: true,
        result: result
      });

    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};
