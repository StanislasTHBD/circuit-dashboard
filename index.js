import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import open from 'open';
import scrapeData from './scraper.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let latestData = [];
let interval = null;

async function updateData() {
  try {
    const newData = await scrapeData();
    latestData = newData;
    io.emit("data", latestData);
    console.log("✅ Données mises à jour !");
  } catch (err) {
    console.error("❌ Erreur scraping :", err);
  }
}

server.listen(3000, async () => {
  console.log("🚀 Serveur lancé sur http://localhost:3000");
  await open("http://localhost:3000");
  updateData();
  interval = setInterval(updateData, 30000);
});

io.on("connection", (socket) => {
  console.log("🟢 Nouveau client connecté");
  socket.emit("data", latestData);
});

process.on("SIGINT", () => {
  console.log("\n⛔ Arrêt du serveur demandé");
  if (interval) clearInterval(interval);
  process.exit();
});
