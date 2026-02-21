const axios = require("axios")

/* ======================
   NIK SCRAPE (DPT + PARSE)
====================== */
async function scrapeDPT(nik) {
  try {
    const home = await axios.get("https://cekdptonline.kpu.go.id/", {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    })

    const html = home.data || ""
    let token = null

    // ambil token dari __NEXT_DATA__
    const match = html.match(/"token"\s*:\s*"([^"]+)"/)
    if (match) token = match[1]

    if (!token) {
      throw new Error("Token tidak ditemukan")
    }

    const payload = {
      query: `
        {
          findNikSidalih(
            nik:"${nik}",
            wilayah_id:0,
            token:"${token}"
          ){
            nama,
            nik,
            nkk,
            provinsi,
            kabupaten,
            kecamatan,
            kelurahan,
            tps,
            alamat,
            lat,
            lon,
            metode,
            lhp {
              nama,
              nik,
              nkk,
              kecamatan,
              kelurahan,
              tps,
              id,
              flag,
              source,
              alamat,
              lat,
              lon,
              metode
            }
          }
        }
      `
    }

    const res = await axios.post(
      "https://cekdptonline.kpu.go.id/v2",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://cekdptonline.kpu.go.id",
          "Referer": "https://cekdptonline.kpu.go.id/",
          "User-Agent": "Mozilla/5.0"
        }
      }
    )

    return res.data?.data?.findNikSidalih || null
  } catch (e) {
    return null
  }
}

/* ======================
   PARSE NIK (LOCAL)
====================== */
async function parseNIK(nik) {
  try {
    const provincesRes = await axios.get(
      "https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json"
    )

    const provinces = Object.fromEntries(
      provincesRes.data.map(p => [p.id, p.name.toUpperCase()])
    )

    if (nik.length !== 16 || !provinces[nik.slice(0, 2)]) {
      throw new Error("NIK tidak valid")
    }

    const provinceId = nik.slice(0, 2)

    const regenciesRes = await axios.get(
      `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceId}.json`
    )

    const regencies = Object.fromEntries(
      regenciesRes.data.map(r => [r.id, r.name.toUpperCase()])
    )

    const regencyId = nik.slice(0, 4)
    if (!regencies[regencyId]) {
      throw new Error("Kabupaten tidak valid")
    }

    const districtsRes = await axios.get(
      `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${regencyId}.json`
    )

    const districts = Object.fromEntries(
      districtsRes.data.map(d => [d.id.slice(0, -1), d.name.toUpperCase()])
    )

    const subdistrict = districts[nik.slice(0, 6)] || "UNKNOWN"

    const day = parseInt(nik.slice(6, 8))
    const month = parseInt(nik.slice(8, 10))
    const yearCode = nik.slice(10, 12)

    const gender = day > 40 ? "PEREMPUAN" : "LAKI-LAKI"
    const birthDay = day > 40 ? day - 40 : day
    const birthYear = parseInt(yearCode) < 30 ? `20${yearCode}` : `19${yearCode}`

    const birth = new Date(birthYear, month - 1, birthDay)
    if (isNaN(birth.getTime())) throw new Error("Tanggal lahir invalid")

    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()

    if (months < 0) {
      months += 12
      years--
    }

    return {
      kelamin: gender,
      lahir: `${birthDay}/${month}/${birthYear}`,
      usia: `${years} tahun ${months} bulan`,
      provinsi: provinces[provinceId],
      kabupaten: regencies[regencyId],
      kecamatan: subdistrict
    }
  } catch (e) {
    return null
  }
}

/* ======================
   ENDPOINT
====================== */
module.exports = [
  {
    name: "nik scrape",
    desc: "Scrape DPT + parse NIK untuk ambil data wilayah & usia",
    category: "Tools",
    path: "/tools/nik-scrape?nik=&apikey=",

    async run(req, res) {
      const { nik, apikey } = req.query

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "apikey invalid" })
      }

      if (!nik || nik.length !== 16) {
        return res.json({ status: false, error: "nik harus 16 digit" })
      }

      try {
        const [dpt, parse] = await Promise.all([
          scrapeDPT(nik),
          parseNIK(nik)
        ])

        return res.json({
          status: true,
          result: {
            nik,
            data: {
              nama: dpt?.nama || "tidak ditemukan",
              kelamin: parse?.kelamin || "unknown",
              usia: parse?.usia || "unknown",
              provinsi: dpt?.provinsi || parse?.provinsi,
              kabupaten: dpt?.kabupaten || parse?.kabupaten,
              kecamatan: dpt?.kecamatan || parse?.kecamatan,
              tps: dpt?.tps || "unknown",
              alamat: dpt?.alamat || "unknown"
            }
          }
        })
      } catch (e) {
        return res.json({
          status: false,
          error: e.message
        })
      }
    }
  }
]
