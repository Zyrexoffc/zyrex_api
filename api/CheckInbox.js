const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Fungsi Inti: Mengambil daftar surat masuk dan langsung mengekstrak seluruh konten teksnya
 */
async function getInboxMessages(email) {
  const [login, domain] = email.split('@');
  if (!login || !domain) {
    return { error: "Format email tidak valid. Pastikan menggunakan email dari domain 1secmail." };
  }

  // 1. Ambil daftar indeks pesan di inbox
  const messagesList = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`)
    .then(r => r.json())
    .catch(() => []);

  // Jika tidak ada pesan atau inbox kosong
  if (!Array.isArray(messagesList) || messagesList.length === 0) {
    return { 
      email, 
      total_messages: 0, 
      messages: [] 
    };
  }

  // 2. Loop semua pesan yang masuk secara paralel untuk mengambil detail teks / isi pesannya
  const fullMessages = await Promise.all(
    messagesList.map(async (msg) => {
      const detail = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${msg.id}`)
        .then(r => r.json())
        .catch(() => null);

      if (detail) {
        return {
          id: detail.id,
          from: detail.from,
          subject: detail.subject,
          date: detail.date,
          textBody: detail.textBody, // Teks murni isi email
          htmlBody: detail.htmlBody, // Format HTML (jika teks murni kosong)
          attachments: detail.attachments || [] // Jika ada lampiran berkas
        };
      }
      return msg;
    })
  );

  return {
    email,
    total_messages: fullMessages.length,
    messages: fullMessages
  };
}

module.exports = {
  name: "CheckInbox",
  desc: "Mengecek inbox email sementara dan menampilkan seluruh isi teks pesan secara realtime",
  category: "Tools",
  path: "/tools/check-inbox?apikey=&email=", // Masukkan alamat email temp-mail lengkap di sini

  async run(req, res) {
    const { email, apikey } = req.query;

    // Validasi API Key bawaan sistemmu
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    // Validasi parameter email wajib diisi
    if (!email) {
      return res.json({ 
        status: false, 
        error: "Parameter 'email' wajib disertakan untuk melakukan pengecekan inbox" 
      });
    }

    try {
      // Eksekusi pencarian pesan masuk
      const result = await getInboxMessages(email);

      if (result.error) {
        return res.json({ status: false, error: result.error });
      }

      // Berhasil mengembalikan data secara bersih dan terstruktur
      res.json({
        status: true,
        result: result
      });

    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};
