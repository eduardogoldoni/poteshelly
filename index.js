const axios = require("axios");
const admin = require("firebase-admin");
const fs = require("fs");

// 🔑 Carrega devices
const devices = JSON.parse(fs.readFileSync("devices.json"));

// 🔑 Variáveis de ambiente
const SHELLY_RPC_URL = "https://shelly-206-eu.shelly.cloud:6022/jrpc"; // pode mudar conforme servidor
const AUTH_KEY = process.env.AUTH_KEY;

// 🔑 Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});
const db = admin.database();

// Função para consultar status de um dispositivo
async function getShellyStatus(deviceId) {
  try {
    const res = await axios.post(SHELLY_RPC_URL, {
      id: 1,
      method: "Shelly.GetStatus",
      auth_key: AUTH_KEY
    }, {
      headers: { "Content-Type": "application/json" }
    });

    return res.data;
  } catch (err) {
    console.error(`❌ Erro ao buscar ${deviceId}:`, err.message);
    return null;
  }
}

// Loop para atualizar Firebase
async function updateFirebase() {
  for (const dev of devices) {
    const status = await getShellyStatus(dev.id);
    if (status && status.result) {
      const path = `telemetria/${dev.id}/last`;
      await db.ref(path).set(status.result);
      console.log(`✅ Atualizado ${dev.id} em ${path}`);
    }
  }
}

// Intervalo de leitura
setInterval(updateFirebase, 10000); // 10s
console.log("🚀 Ponte Shelly Cloud → Firebase iniciada");
