const fetch = global.fetch;
const { URLSearchParams } = require("url");
const crypto = require("crypto");
const FormData = require("form-data");

/* =================================================================
   CORE CONFIGURATION & CONSTANTS (SINKRONISASI TOTAL DENGAN PHP)
==================================================================== */
const API_URL = "https://app.orderkuota.com/api/v2";
const HOST = "app.orderkuota.com";
const USER_AGENT = "okhttp/4.12.0";
const KONCI_RAHASIA = "orderkuota_mobile_app_2024";

const APP_VERSION_NAME = "26.01.15";
const APP_VERSION_CODE = "260115";
const PHONE_MODEL = "SM-G973F";
const PHONE_ANDROID_VERSION = "15";

/* =================================================================
   INTERNAL HELPER FUNCTIONS (SISTEM GENERATOR & CRYPTO)
==================================================================== */

/**
 * Menggenerasi Device Fingerprint dinamis (UUID & FCM Token) setiap kali endpoint dieksekusi
 */
function generateDeviceFingerprint() {
  const rawUuid = crypto.randomBytes(16).toString("hex");
  const phoneUuid = [
    rawUuid.substring(0, 8),
    rawUuid.substring(8, 12),
    rawUuid.substring(12, 16),
    rawUuid.substring(16, 20),
    rawUuid.substring(20, 32)
  ].join("-");

  const fcmHash = crypto.createHash("sha256").update(crypto.randomBytes(16)).digest("hex");
  const appRegId = `${phoneUuid}:APA91b${fcmHash.substring(0, 100)}`;

  return { phoneUuid, appRegId };
}

/**
 * Membuat Signature HMAC SHA256 untuk validasi mutasi pusat
 */
function generateSignature(params, timestamp) {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams = {};
  sortedKeys.forEach(key => {
    sortedParams[key] = params[key];
  });

  const base = new URLSearchParams(sortedParams).toString() + `&timestamp=${timestamp}&secret=${KONCI_RAHASIA}`;
  return crypto.createHmac("sha256", KONCI_RAHASIA).update(base).digest("hex");
}

/**
 * Standarisasi Request Engine Outbound Fetch
 */
async function sendRequest(method, url, body = null, extraHeaders = {}) {
  const headers = {
    Host: HOST,
    "User-Agent": USER_AGENT,
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept-Encoding": "gzip",
    ...extraHeaders
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? body.toString() : null
  });

  const textData = await res.text();
  try {
    return JSON.parse(textData);
  } catch {
    return textData;
  }
}

function convertCRC16(str) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return ("000" + (crc & 0xffff).toString(16).toUpperCase()).slice(-4);
}

function generateTransactionId() {
  return `SKY-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function generateExpirationTime() {
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 30);
  
  const YYYY = exp.getFullYear();
  const MM = String(exp.getMonth() + 1).padStart(2, '0');
  const DD = String(exp.getDate()).padStart(2, '0');
  const hh = String(exp.getHours()).padStart(2, '0');
  const mm = String(exp.getMinutes()).padStart(2, '0');
  const ss = String(exp.getSeconds()).padStart(2, '0');
  
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

function extractQrisData(maybe) {
  if (!maybe) return null;
  if (typeof maybe === "string") return maybe;
  if (typeof maybe === "object" && typeof maybe.qris_data === "string") return maybe.qris_data;
  if (Array.isArray(maybe)) {
    for (const item of maybe) {
      if (item && typeof item.qris_data === "string") return item.qris_data;
    }
  }
  return null;
}

/* =================================================================
   IMAGE HOSTING MULTI-PROVIDER ENGINE (FALLBACK SYSTEM)
==================================================================== */

async function uploadToPixhost(buffer) {
  const form = new FormData();
  form.append("content_type", "0");
  form.append("img", buffer, { filename: "qris.png", contentType: "image/png" });

  const res = await fetch("https://api.pixhost.to/images", {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "X-Requested-With": "XMLHttpRequest",
      ...form.getHeaders()
    },
    body: form
  });

  const data = await res.json();
  if (!data || !data.show_url) throw new Error("Pixhost response tidak valid");

  const pageRes = await fetch(data.show_url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
  const html = await pageRes.text();
  const match = html.match(/<img[^>]+class="image-img"[^>]+src="([^"]+)"/i);
  
  if (match && match[1]) {
    let directUrl = match[1];
    if (directUrl.startsWith("//")) return "https:" + directUrl;
    if (directUrl.startsWith("/")) return "https://pixhost.to" + directUrl;
    return directUrl;
  }
  throw new Error("Gagal ekstraksi direct URL Pixhost");
}

async function uploadToUploadCC(buffer) {
  const form = new FormData();
  form.append("uploaded_file[]", buffer, { filename: "qris.png", contentType: "image/png" });

  const res = await fetch("https://upload.cc/image_upload", {
    method: "POST",
    headers: {
      "Referer": "https://upload.cc",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ...form.getHeaders()
    },
    body: form
  });

  const data = await res.json();
  if (data && data.code === 100 && data.success_image && data.success_image[0]) {
    return "https://upload.cc/" + data.success_image[0].url.replace(/^\//, "");
  }
  throw new Error("UploadCC response gagal");
}

async function uploadToCatbox(buffer) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, { filename: "qris.png", contentType: "image/png" });

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    headers: form.getHeaders(),
    body: form
  });

  const url = await res.text();
  if (url && url.trim().startsWith("http")) return url.trim();
  throw new Error("Catbox upload gagal");
}

async function uploadImageAutoFallback(buffer) {
  try { return await uploadToPixhost(buffer); } catch (e) { console.log(`[Fallback] Pixhost error: ${e.message}. Mencoba UploadCC...`); }
  try { return await uploadToUploadCC(buffer); } catch (e) { console.log(`[Fallback] UploadCC error: ${e.message}. Mencoba Catbox...`); }
  try { return await uploadToCatbox(buffer); } catch (e) { throw new Error("Semua provider hosting image gagal."); }
}

async function createQRIS(amount, codeqr) {
  if (!codeqr || typeof codeqr !== "string" || codeqr.length < 10) throw new Error("Data string QRIS pusat tidak valid.");

  let qrisData = codeqr.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const step2 = step1.split("5802ID");

  amount = String(amount);
  let uang = "54" + ("0" + amount.length).slice(-2) + amount + "5802ID";
  const final = step2.length >= 2 ? (step2[0] + uang + step2.slice(1).join("5802ID")) : (step1 + uang);
  const result = final + convertCRC16(final);

  // Render QR via External Server API sesuai fungsi PHP createQRIS
  const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=25&data=${encodeURIComponent(result)}`;
  const qrFetch = await fetch(qrServerUrl);
  const arrayBuffer = await qrFetch.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadedUrl = await uploadImageAutoFallback(buffer);

  return {
    idtransaksi: generateTransactionId(),
    jumlah: amount,
    expired: generateExpirationTime(),
    imageqris: { url: uploadedUrl },
    qr_string: result,
  };
}

/* =================================================================
   REST API ROUTER EXPORTS (NO-CLASS SEKUENSIAL & STRUKTUR LU)
==================================================================== */

module.exports = [
  {
    name: "Get OTP (tahap 1)",
    desc: "Get OTP Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/getotp?apikey=&username=&password=",
    async run(req, res) {
      const { apikey, username, password } = req.query;

      const validApiKeys = ["skyy7", "Lyyncode", "Time160110", "luxzz02", "KhafaCode"];
      if (!validApiKeys.includes(apikey)) return res.status(400).json({ status: false, message: "API Key tidak valid." });

      if (!username || !password) {
        return res.status(400).json({ status: false, message: "Parameter 'username' dan 'password' wajib diisi." });
      }

      try {
        const device = generateDeviceFingerprint();
        const payload = new URLSearchParams({
          username,
          password,
          request_time: String(Date.now()),
          app_reg_id: device.appRegId,
          phone_android_version: PHONE_ANDROID_VERSION,
          app_version_code: APP_VERSION_CODE,
          phone_uuid: device.phoneUuid,
        });

        const response = await sendRequest("POST", `${API_URL}/login`, payload);

        res.json({
          status: true,
          action: "getotp",
          result: response
        });
      } catch (err) {
        res.status(400).json({ status: false, message: err.message });
      }
    },
  },
  {
    name: "Get Token (tahap 2)",
    desc: "Get Token Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/gettoken?apikey=&username=&otp=",
    async run(req, res) {
      const { apikey, username, otp } = req.query;
      
      const validApiKeys = ["skyy7", "Lyyncode", "Time160110", "luxzz02", "KhafaCode"];
      if (!validApiKeys.includes(apikey)) return res.status(400).json({ status: false, message: "API Key tidak valid." });
      
      if (!username || !otp) {
        return res.status(400).json({ status: false, message: "Parameter 'username' dan 'otp' wajib diisi." });
      }
      
      try {
        const device = generateDeviceFingerprint();
        const payload = new URLSearchParams({
          username,
          password: otp,
          request_time: String(Date.now()),
          app_reg_id: device.appRegId,
          phone_android_version: PHONE_ANDROID_VERSION,
          app_version_code: APP_VERSION_CODE,
          phone_uuid: device.phoneUuid,
        });

        const response = await sendRequest("POST", `${API_URL}/login`, payload);

        res.json({ 
          status: true, 
          action: "gettoken",
          result: response 
        });
      } catch (err) {
        res.status(400).json({ status: false, message: err.message });
      }
    },
  },
  {
    name: "Create QRIS",
    desc: "Generate QR Code Payment",
    category: "Orderkuota",
    path: "/orderkuota/createpayment?apikey=&username=&token=&amount=",
    async run(req, res) {
      const { apikey, username, token, amount } = req.query;

      const validApiKeys = ["skyy7", "Lyyncode", "Time160110", "luxzz02", "KhafaCode"];
      if (!validApiKeys.includes(apikey)) return res.status(400).json({ status: false, message: "API Key tidak valid." });
      
      if (!username || !token) return res.status(400).json({ status: false, message: "Parameter 'username' dan 'token' wajib diisi." });
      
      const amt = Number(String(amount).trim());
      if (isNaN(amt) || amt <= 0) return res.status(400).json({ status: false, message: "Nominal 'amount' harus > 0" });

      try {
        const device = generateDeviceFingerprint();
        const payload = new URLSearchParams({
          request_time: String(Date.now()),
          app_reg_id: device.appRegId,
          phone_android_version: PHONE_ANDROID_VERSION,
          app_version_code: APP_VERSION_CODE,
          phone_uuid: device.phoneUuid,
          auth_username: username,
          auth_token: token,
          "requests[qris_merchant_terms][jumlah]": String(amt),
          "requests[0]": "qris_merchant_terms",
          app_version_name: APP_VERSION_NAME,
          phone_model: PHONE_MODEL,
        });

        const qrResponse = await sendRequest("POST", `${API_URL}/get`, payload);
        const qrisData = extractQrisData(qrResponse);

        if (!qrisData) {
          throw new Error(`Gagal QRIS: ${typeof qrResponse === 'object' ? JSON.stringify(qrResponse) : 'No qris_data'}`);
        }

        const qrisResult = await createQRIS(String(amt), qrisData);

        res.json({
          status: true,
          action: "createpayment",
          result: {
            trxid: qrisResult.idtransaksi,
            nominal: qrisResult.jumlah,
            expired: qrisResult.expired,
            qris_image: qrisResult.imageqris.url,
            qris_string: qrisResult.qr_string,
          }
        });
      } catch (error) {
        res.status(400).json({ status: false, message: error.message });
      }
    },
  },
  {
    name: "Cek Mutasi QRIS",
    desc: "Cek Mutasi Qris Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/mutasiqr?apikey=&username=&token=",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      
      const validApiKeys = ["skyy7", "Lyyncode", "Time160110", "luxzz02", "KhafaCode"];
      if (!validApiKeys.includes(apikey)) return res.status(400).json({ status: false, message: "API Key tidak valid." });
      if (!username || !token) return res.status(400).json({ status: false, message: "Parameter 'username' dan 'token' wajib diisi." });
      
      try {
        const resellerId = String(token).split(":")[0];
        const requestTime = Date.now();
        const device = generateDeviceFingerprint();

        const paramsForSign = {
          auth_username: username,
          auth_token: token,
          phone_uuid: device.phoneUuid,
          request_time: String(requestTime),
        };

        const signature = generateSignature(paramsForSign, requestTime);

        const payload = new URLSearchParams({
          app_reg_id: device.appRegId,
          phone_uuid: device.phoneUuid,
          phone_model: PHONE_MODEL,
          "requests[qris_history][keterangan]": "",
          "requests[qris_history][jumlah]": "",
          "requests[qris_history][jenis]": "1",
          request_time: String(requestTime),
          phone_android_version: PHONE_ANDROID_VERSION,
          app_version_code: APP_VERSION_CODE,
          auth_username: username,
          "requests[qris_history][page]": "1",
          auth_token: token,
          app_version_name: APP_VERSION_NAME,
          ui_mode: "light",
          "requests[qris_history][dari_tanggal]": "",
          "requests[0]": "account",
          "requests[qris_history][ke_tanggal]": "",
        });

        const extraHeaders = {
          "signature": signature,
          "timestamp": String(requestTime),
        };

        const endpoint = `${API_URL}/qris/mutasi/${resellerId}`;
        const mutasi = await sendRequest("POST", endpoint, payload, extraHeaders);

        res.json({ 
          status: true, 
          action: "mutasiqr",
          result: mutasi.qris_history || mutasi 
        });
      } catch (err) {
        res.status(400).json({ status: false, message: err.message });
      }
    },
  },
];
