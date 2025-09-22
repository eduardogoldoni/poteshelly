const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");
const devices = require("./devices.json");

// ---- FIREBASE ----
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});

const db = admin.database();

// ---- EXPRESS SERVER ----
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Ponte Shelly + Firebase está rodando!");
});

app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});

// ---- FUNÇÃO PARA LER SHELLY CLOUD ----
async function fetchDevice(device) {
  try {
    const url = `https://shelly-33-eu.shelly.cloud/device/status?auth_key=${process.env.AUTH_KEY}&id=${device.id}`;
    const response = await axios.get(url);

    if (response.data.isok) {
      const data = response.data.data.device_status;

      // salva no Firebase
      await db.ref(`telemetria/${device.id}/last`).set({
        temp: data.temperature || null,
        hum: data.humidity || null,
        bat: data.battery || null,
        timestamp: Date.now()
      });

      console.log(`✅ Atualizado no Firebase: ${device.id}`);
    } else {
      console.error(`Erro Shelly:`, response.data.errors);
    }
  } catch (err) {
    console.error(`Erro ao buscar ${device.id}:`, err.message);
  }
}

// ---- LOOP ----
setInterval(() => {
  devices.forEach(fetchDevice);
}, 60 * 1000); // a cada 1 min
