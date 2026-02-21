const axios = require("axios");

/* ======================
UTILITY VALIDATION
====================== */
function isValidDomain(domain) {
  const regex = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;
  return regex.test(domain);
}

function isValidIP(ip) {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
  return regex.test(ip);
}

/* ======================
FORMATTER
====================== */
function clean(value) {
  if (!value) return "N/A";
  return String(value);
}

/* ======================
EXPORT ENDPOINT
====================== */
module.exports = [
{
  name: "Whois Lookup",
  desc: "Cek informasi lengkap domain atau IP",
  category: "Tools",
  path: "/tools/whois?apikey=&target=",

  async run(req, res) {
    const { apikey, target } = req.query;

    /* ======================
       APIKEY VALIDATION
    ====================== */
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    /* ======================
       PARAM VALIDATION
    ====================== */
    if (!target) {
      return res.json({
        status: false,
        error: "Masukkan parameter target (domain/IP)"
      });
    }

    if (!isValidDomain(target) && !isValidIP(target)) {
      return res.json({
        status: false,
        error: "Target tidak valid (harus domain atau IPv4)"
      });
    }

    try {

      /* ======================
         REQUEST WHOIS API
      ====================== */
      const response = await axios.get(
        `https://api.whois.vu/?q=${encodeURIComponent(target)}`,
        {
          timeout: 15000
        }
      );

      if (!response.data || response.data.status === "error") {
        return res.json({
          status: false,
          error: "Data tidak ditemukan"
        });
      }

      const data = response.data;

      /* ======================
         PARSING RESULT
      ====================== */
      const result = {
        target: target,
        type: isValidIP(target) ? "IP Address" : "Domain",
        registrar: clean(data.registrar),
        organization: clean(data.org),
        country: clean(data.country),
        state: clean(data.state),
        city: clean(data.city),
        zipcode: clean(data.zip),
        created_date: clean(data.created),
        updated_date: clean(data.updated),
        expiration_date: clean(data.expires),
        name_servers: data.nameservers
          ? Array.isArray(data.nameservers)
            ? data.nameservers
            : [data.nameservers]
          : [],
        status_domain: data.status
          ? Array.isArray(data.status)
            ? data.status
            : [data.status]
          : []
      };

      /* ======================
         FINAL RESPONSE
      ====================== */
      return res.json({
        status: true,
        result: result
      });

    } catch (error) {

      /* ======================
         ERROR HANDLING
      ====================== */
      if (error.code === "ECONNABORTED") {
        return res.status(504).json({
          status: false,
          error: "Request timeout"
        });
      }

      return res.status(500).json({
        status: false,
        error: "Internal Server Error",
        message: error.message
      });
    }
  }
}
];
