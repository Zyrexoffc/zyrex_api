const axios = require("axios");

/* ======================
   SUIT GAME (SCRAPE STYLE)
====================== */

const choices = ["batu", "gunting", "kertas"];

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

module.exports = [
{
    name: "Suit",
    desc: "Main batu gunting kertas",
    category: "Fun",
    path: "/fun/suit?apikey=&pilihan=",

    async run(req, res) {
        const { apikey, pilihan } = req.query;

        /* APIKEY VALIDATION */
        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({
                status: false,
                error: "Apikey invalid"
            });
        }

        /* PARAM VALIDATION */
        if (!pilihan) {
            return res.json({
                status: false,
                error: "Masukkan parameter pilihan: batu/gunting/kertas"
            });
        }

        const userChoice = pilihan.toLowerCase().trim();

        if (!choices.includes(userChoice)) {
            return res.json({
                status: false,
                error: "Pilihan tidak valid. Gunakan: batu, gunting, atau kertas"
            });
        }

        try {
            const botChoice = pickRandom(choices);
            let result;

            if (userChoice === botChoice) {
                result = "🤝 Seri!";
            } else if (
                (userChoice === "batu" && botChoice === "gunting") ||
                (userChoice === "gunting" && botChoice === "kertas") ||
                (userChoice === "kertas" && botChoice === "batu")
            ) {
                result = "🎉 Kamu MENANG!";
            } else {
                result = "😭 Kamu KALAH!";
            }

            return res.json({
                status: true,
                result: {
                    pilihan_user: userChoice,
                    pilihan_bot: botChoice,
                    hasil: result
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
