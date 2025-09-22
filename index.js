const axios = require('axios');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

// 🔑 Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});

const db = admin.database();

// 🔑 Configurações
const AUTH_KEY = process.env.AUTH_KEY;
const devices = require('./devices.json');

// Função para buscar dados no Shelly Cloud
async function fetchShelly(deviceId) {
  try {
    const url = `https://shelly-206-eu.shelly.cloud/device/status`;
    const response = await axios.post(url, {
      id: deviceId,
      auth_key: AUTH_KEY
    });

    if (response.data && response.data.data) {
      console.log(`✅ Sucesso: ${deviceId}`);
      return response.data.data;
    } else {
      console.log(`⚠️ Resposta inesperada:`, response.data);
      return null;
    }
  } catch (err) {
    console.error(`❌ Erro ao buscar ${deviceId}:`, err.message);
    return null;
  }
}

// Função principal
async function updateFirebase() {
  for (const device of devices) {
    const data = await fetchShelly(device.id);
    if (data) {
      await db.ref(`telemetria/${device.id}/last`).set({
        timestamp: Date.now(),
        data: data
      });
    }
  }
}

// Loop de atualização
setInterval(updateFirebase, 10000);
updateFirebase();

// Servidor para Render Free
app.get('/', (req, res) => {
  res.send("Ponte Shelly Cloud + Firebase rodando!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
