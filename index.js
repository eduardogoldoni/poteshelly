// index.js
const axios = require("axios");
const admin = require("firebase-admin");

// 🔓 Ignorar certificados SSL não confiáveis (necessário para Shelly RPC)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Carregar credenciais do Firebase a partir da variável de ambiente
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});

const db = admin.database();

// Configurações do Shelly
const devices = require("./devices.json");
const AUTH_KEY = process.env.AUTH_KEY;

console.log("🚀 Ponte Shelly Cloud + Firebase iniciada");

async function getShellyStatus(deviceId) {
  try {
    const url = `https://shelly-33-eu.shelly.cloud/device/status?id=${deviceId}&auth_key=${AUTH_KEY}`;
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error(`❌ Erro ao buscar ${deviceId}:`, err.message);
    return null;
  }
}

async function updateFirebase() {
  for (const d of devices) {
    const data = await getShellyStatus(d.id);
    if (data && data.data) {
      await db.ref(`telemetria/${d.id}/last`).set({
        ts: Date.now(),
        status: data.data
      });
      console.log(`✅ Atualizado no Firebase: ${d.id}`);
    }
  }
}

// Atualiza a cada 30 segundos
setInterval(updateFirebase, 30000);
updateFirebase();
