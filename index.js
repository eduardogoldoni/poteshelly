const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

// =========================
// 🔑 Variáveis de ambiente
// =========================
const AUTH_KEY = process.env.AUTH_KEY; // chave do Shelly
const FIREBASE_URL = process.env.FIREBASE_URL; // URL RTDB
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

// =========================
// 🔥 Firebase
// =========================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT),
    databaseURL: FIREBASE_URL,
  });
}
const db = admin.database();

// =========================
// 📡 Dispositivos
// =========================
const devices = require("./devices.json");

// =========================
// 🔄 Função para buscar Shelly Cloud
// =========================
async function fetchShelly(device) {
  try {
    const url = `https://shelly-33-eu.shelly.cloud/device/status?id=${device.id}&auth_key=${AUTH_KEY}`;
    const response = await axios.get(url);

    if (response.data && response.data.data && response.data.data.device_status) {
      const status = response.data.data.device_status;

      // salva no Firebase
      await db.ref(`telemetria/${device.id}/last`).set({
        temperature: status.tmp?.value || null,
        humidity: status.hum?.value || null,
        battery: status.bat?.value || null,
        updatedAt: Date.now(),
      });

      console.log(`✅ Atualizado ${device.name}`);
    } else {
      console.log(`⚠️ Resposta inesperada para ${device.name}`);
    }
  } catch (err) {
    console.error(`❌ Erro ao buscar ${device.name}:`, err.message);
  }
}

// =========================
// 🔁 Loop de atualização
// =========================
setInterval(() => {
  devices.forEach((d) => fetchShelly(d));
}, 30000); // a cada 30s

// =========================
// 🌐 Endpoint básico
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Ponte Shelly Cloud + Firebase rodando!");
});

// =========================
// ▶️ Inicia servidor
// =========================
app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
