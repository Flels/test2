// Einstiegspunkt des Backends: Express-App konfigurieren und starten.
import 'dotenv/config'; // lädt .env in process.env – muss als ERSTES importiert werden
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import produkteRouter from './routes/produkte.js';
import bestellungenRouter from './routes/bestellungen.js';
import statistikRouter from './routes/statistik.js';
import authRouter from './routes/auth.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET fehlt in .env');
  process.exit(1);
}

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Nur das eigene Frontend darf die API aus dem Browser aufrufen
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));
app.use(express.json({ limit: '100kb' }));

// Produktbilder aus dem Dateisystem ausliefern: GET /bilder/kaffee.svg
app.use('/bilder', express.static(path.join(__dirname, '..', 'bilder')));

// API-Routen
app.use('/api/produkte', produkteRouter);
app.use('/api/bestellungen', bestellungenRouter);
app.use('/api/statistik', statistikRouter);
app.use('/api/auth', authRouter);

// Unbekannte Route
app.use((req, res) => res.status(404).json({ fehler: 'Route nicht gefunden' }));

// Zentrale Fehlerbehandlung (4 Parameter!) – keine internen Details an den Client
app.use((err, req, res, next) => {
  // z. B. ungültiges JSON im Body -> 400 statt 500
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ fehler: 'Ungültige Anfrage' });
  }
  console.error(err);
  res.status(500).json({ fehler: 'Interner Serverfehler' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Backend läuft auf http://localhost:${port}`));
