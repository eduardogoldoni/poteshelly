const axios = require("axios");
const https = require("https");

// Ignorar SSL globalmente
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function getShellyStatus(deviceId) {
  try {
    const url = `https://shelly-33-eu.shelly.cloud/device/status?id=${deviceId}&auth_key=${process.env.AUTH_KEY}`;
    const res = await axios.get(url, { httpsAgent });
    return res.data;
  } catch (err) {
    console.error(`❌ Erro ao buscar ${deviceId}:`, err.message);
    return null;
  }
}
