const axios = require("axios");
const admin = require("firebase-admin");
const devices = require("./devices.json");

// Pega configs do Render
const AUTH_KEY = process.env.AUTH_KEY;
const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicializa Firebase
admin.initializeApp({
  credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT),
  databaseURL: FIREBASE_URL,
});

const db = admin.database();

async function fetchShellyData(device) {
  try {
    const url = `https://shelly-49-eu.shelly.cloud/device/status?auth_key=${AUTH_KEY}&id=${device.id}`;
    const res = await axios.get(url);

    if (!res.data || !res.data.data) {
      console.log(`❌ Erro ao buscar ${device.id}`);
      return;
    }

    const status = res.data.data.device_status;
    let payload = { timestamp: Date.now() };

    if (device.type === "ht") {
      payload.temp = status.tmp?.tC || null;
      payload.hum = status.hum?.rh || null;
      payload.bat = status.bat?.value || null;
    }

    await db.ref(`telemetria/${device.id}/last`).set(payload);
    console.log(`✅ Dados enviados: ${device.id}`, payload);

  } catch (err) {
    console.error(`Erro no dispositivo ${device.id}:`, err.message);
  }
}

async function loop() {
  for (const dev of devices) {
    await fetchShellyData(dev);
  }
}

console.log("🌍 Ponte Shelly Cloud + Firebase iniciada");
setInterval(loop, 60000); // roda a cada 60s
