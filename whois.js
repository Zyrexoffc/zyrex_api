const axios = require("axios");
const dns = require("dns").promises;
const tls = require("tls");

/* ======================
UTILITY VALIDATION
====================== */
function isValidDomain(domain) {
  const regex = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;
  return regex.test(domain);
}

function isValidIP(ip) {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
  return regex.test(ip);
}

function clean(v) {
  if (!v) return "N/A";
  return String(v);
}

/* ======================
SSL CHECKER
====================== */
function getSSLInfo(host) {
  return new Promise((resolve) => {
    const socket = tls.connect(443, host, { servername: host, timeout: 8000 }, () => {
      const cert = socket.getPeerCertificate();
      if (!cert || Object.keys(cert).length === 0) {
        resolve(null);
      } else {
        resolve({
          issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown",
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
        });
      }
      socket.end();
    });

    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/* ======================
EXPORT ENDPOINT
====================== */
module.exports = [
{
  name: "Whois Pro Lookup",
  desc: "Cek informasi lengkap domain/IP + DNS + SSL + Geo + ASN",
  category: "Tools",
  path: "/tools/whoispro?apikey=&target=",

  async run(req, res) {
    const { apikey, target } = req.query;

    /* APIKEY */
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!target) {
      return res.json({ status: false, error: "Masukkan parameter target" });
    }

    if (!isValidDomain(target) && !isValidIP(target)) {
      return res.json({
        status: false,
        error: "Target harus domain atau IPv4 valid"
      });
    }

    try {
      let ip = target;
      let domain = null;

      /* ======================
         DOMAIN → IP RESOLVE
      ====================== */
      if (isValidDomain(target)) {
        domain = target;
        const resolveIP = await dns.lookup(target);
        ip = resolveIP.address;
      }

      /* ======================
         WHOIS DATA
      ====================== */
      const whoisRes = await axios.get(
        `https://api.whois.vu/?q=${encodeURIComponent(target)}`,
        { timeout: 15000 }
      ).catch(() => null);

      const whoisData = whoisRes?.data || {};

      /* ======================
         GEO + ASN DATA
      ====================== */
      const geoRes = await axios.get(
        `http://ip-api.com/json/${ip}?fields=status,message,continent,country,regionName,city,zip,lat,lon,isp,org,as`,
        { timeout: 10000 }
      ).catch(() => null);

      const geoData = geoRes?.data || {};

      /* ======================
         DNS RECORD
      ====================== */
      let dnsRecords = {
        A: [],
        MX: [],
        NS: [],
        TXT: []
      };

      if (domain) {
        try { dnsRecords.A = await dns.resolve4(domain); } catch {}
        try { dnsRecords.MX = await dns.resolveMx(domain); } catch {}
        try { dnsRecords.NS = await dns.resolveNs(domain); } catch {}
        try { dnsRecords.TXT = await dns.resolveTxt(domain); } catch {}
      }

      /* ======================
         REVERSE DNS
      ====================== */
      let reverseDNS = [];
      try {
        reverseDNS = await dns.reverse(ip);
      } catch {}

      /* ======================
         SSL CHECK
      ====================== */
      let sslInfo = null;
      if (domain) {
        sslInfo = await getSSLInfo(domain);
      }

      /* ======================
         FINAL RESULT
      ====================== */
      const result = {
        target,
        type: isValidIP(target) ? "IP Address" : "Domain",
        ip_address: clean(ip),
        reverse_dns: reverseDNS.length ? reverseDNS : [],
        registrar: clean(whoisData.registrar),
        organization: clean(whoisData.org),
        created_date: clean(whoisData.created),
        updated_date: clean(whoisData.updated),
        expiration_date: clean(whoisData.expires),

        geo_location: {
          continent: clean(geoData.continent),
          country: clean(geoData.country),
          region: clean(geoData.regionName),
          city: clean(geoData.city),
          zipcode: clean(geoData.zip),
          latitude: clean(geoData.lat),
          longitude: clean(geoData.lon),
        },

        network: {
          isp: clean(geoData.isp),
          organization: clean(geoData.org),
          asn: clean(geoData.as),
        },

        dns_records: dnsRecords,

        ssl_certificate: sslInfo
          ? {
              issuer: sslInfo.issuer,
              valid_from: sslInfo.valid_from,
              valid_to: sslInfo.valid_to
            }
          : "No SSL / Not Available"
      };

      return res.json({
        status: true,
        result
      });

    } catch (err) {
      if (err.code === "ECONNABORTED") {
        return res.status(504).json({
          status: false,
          error: "Request timeout"
        });
      }

      return res.status(500).json({
        status: false,
        error: "Internal Server Error",
        message: err.message
      });
    }
  }
}
];                errorText.toLowerCase().includes("limit") ||
                errorText.toLowerCase().includes("rate")
            ) {
                currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                attempts++;
                continue;
            }

            // Network error → coba token berikutnya
            if (!status) {
                currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                attempts++;
                continue;
            }

            return {
                success: false,
                error: errorText,
                status: status || 500
            };
        }
    }

    return {
        success: false,
        error: "All tokens exhausted or limited",
        status: 429
    };
}

module.exports = {
  name: "React Channel WhatsApp",
  desc: "React emoji to WhatsApp Channel Post",
  category: "Tools",
  path: "/tools/react-channel?apikey=&postUrl=&emoji=",

  async run(req, res) {
    const { apikey, postUrl, emoji } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }

    if (!postUrl) {
      return res.json({ status: false, error: "postUrl is required" });
    }

    if (!emoji) {
      return res.json({ status: false, error: "emoji is required" });
    }

    try {
      const result = await reactToChannel(postUrl, emoji);

      if (!result.success) {
        return res.status(result.status).json({
          status: false,
          error: result.error
        });
      }

      res.json({
        status: true,
        data: result.data
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};
