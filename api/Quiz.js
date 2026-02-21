const axios = require("axios");

/* ======================
SESSION STORAGE
====================== */
const quizSession = new Map();

/* ======================
HELPER
====================== */
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

/* ======================
EXPORT
====================== */
module.exports = [
{
  name: "Quiz Game",
  desc: "Main quiz random dari internet",
  category: "Fun",
  path: "/fun/quiz?apikey=&id=&jawaban=",

  async run(req, res) {
    const { apikey, id, jawaban } = req.query;

    /* === APIKEY VALIDATION === */
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    try {

      /* =========================
         JIKA BELUM ADA ID → AMBIL SOAL BARU
      ========================= */
      if (!id) {

        const response = await axios.get(
          "https://opentdb.com/api.php?amount=1&type=multiple"
        );

        const data = response.data;

        if (!data.results || data.results.length === 0) {
          return res.json({
            status: false,
            error: "Gagal mengambil soal"
          });
        }

        const quiz = data.results[0];

        const question = quiz.question
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");

        const correct = quiz.correct_answer;

        const options = shuffleArray([
          ...quiz.incorrect_answers,
          correct
        ]);

        const quizId = generateId();

        // simpan session
        quizSession.set(quizId, {
          correct
        });

        return res.json({
          status: true,
          result: {
            id: quizId,
            soal: question,
            pilihan: options,
            cara_jawab: `Tambahkan &id=${quizId}&jawaban=ISI_JAWABAN`
          }
        });
      }

      /* =========================
         CEK JAWABAN
      ========================= */
      if (!quizSession.has(id)) {
        return res.json({
          status: false,
          error: "Soal tidak ditemukan atau sudah expired"
        });
      }

      if (!jawaban) {
        return res.json({
          status: false,
          error: "Masukkan parameter jawaban"
        });
      }

      const session = quizSession.get(id);
      const benar =
        jawaban.toLowerCase() === session.correct.toLowerCase();

      // hapus setelah dijawab
      quizSession.delete(id);

      return res.json({
        status: true,
        result: {
          jawaban_kamu: jawaban,
          jawaban_benar: session.correct,
          hasil: benar ? "🎉 Jawaban Benar!" : "❌ Jawaban Salah!"
        }
      });

    } catch (e) {
      return res.status(500).json({
        status: false,
        error: e.message
      });
    }
  }
}
];
