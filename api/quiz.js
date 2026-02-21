const axios = require("axios");

/* ======================
HELPER FUNCTION
====================== */
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

/* ======================
EXPORT ENDPOINT
====================== */
module.exports = [
{
  name: "Quiz Game",
  desc: "Main quiz random dari internet",
  category: "fun",
  path: "/fun/quiz?apikey=&jawaban=",

  async run(req, res) {
    const { apikey, jawaban } = req.query;

    /* === APIKEY VALIDATION === */
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    try {

      /* === SCRAPE QUIZ API === */
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

      /* =========================
         JIKA USER BELUM JAWAB
      ========================= */
      if (!jawaban) {
        return res.json({
          status: true,
          result: {
            soal: question,
            pilihan: options,
            info: "Kirim parameter &jawaban= untuk menjawab"
          }
        });
      }

      /* =========================
         CEK JAWABAN USER
      ========================= */
      const benar = jawaban.toLowerCase() === correct.toLowerCase();

      return res.json({
        status: true,
        result: {
          soal: question,
          jawaban_kamu: jawaban,
          jawaban_benar: correct,
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
