import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import open from 'open';
import scrapeDataMercredi from './scraper-mercredi.js';
import scrapeDataSamedi from './scraper-samedi.js';
import scrapeDataVendrediLundi from './scraper-vendredi-lundi.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let latestData = [];
let lastUpdateTime = new Date();
let nextUpdateTime = lastUpdateTime.getTime() + 300000; // 5 minutes from the initial server start

// Function to calculate remaining time until the next update
function calculateRemainingTime() {
  const remainingTime = nextUpdateTime - Date.now();
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  return { remainingTime, formatted: `${minutes} minutes ${seconds} secondes` };
}

// Function to update data and emit updates to the client
async function updateData() {
  try {
    const newDataMercredi = await scrapeDataMercredi();
    const newDataSamedi = await scrapeDataSamedi();
    const newDataVendrediLundi = await scrapeDataVendrediLundi();

    // Combine all data into one array
    latestData = [
      ...newDataMercredi,
      ...newDataSamedi,
      ...newDataVendrediLundi
    ];

    // Update the last update time
    lastUpdateTime = new Date();

    // Calculate the time remaining for the next refresh
    nextUpdateTime = lastUpdateTime.getTime() + 300000; // Reset to 5 minutes from now

    // Emit the updated data, time, and next update time
    io.emit("data", latestData);
    io.emit("update-time", lastUpdateTime.toLocaleString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
      hour: 'numeric', minute: 'numeric', second: 'numeric' 
    }));
    io.emit("next-update", calculateRemainingTime().formatted);

    console.log("✅ Données mises à jour !");
  } catch (err) {
    console.error("❌ Erreur scraping :", err);
  }
}

server.listen(3179, async () => {
  console.log("🚀 Serveur lancé sur http://localhost:3179");
  await open("http://localhost:3179");
  updateData();
  setInterval(updateData, 300000); // Update every 5 min
});

// On connection, send data and start countdown
io.on("connection", (socket) => {
  console.log("🟢 Nouveau client connecté");

  // Emit initial data to the new client
  socket.emit("data", latestData);
  socket.emit("update-time", lastUpdateTime.toLocaleString('fr-FR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
    hour: 'numeric', minute: 'numeric', second: 'numeric' 
  }));

  // Emit the remaining time for the next update
  socket.emit("next-update", calculateRemainingTime().formatted); // Emit initial time remaining
  
  // Listen for client disconnection
  socket.on('disconnect', () => {
    console.log('🟠 Client déconnecté');
  });
});

process.on("SIGINT", () => {
  console.log("\n⛔ Arrêt du serveur demandé");
  process.exit();
});
