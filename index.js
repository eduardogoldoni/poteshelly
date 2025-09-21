const axios = require("axios");
const https = require("https");

// Criar agente HTTPS que ignora certificados inválidos
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
