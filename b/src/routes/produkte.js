// Routen für Produkte (Aufgabe 2)
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/produkte  -> Liste aller aktiven Produkte (Bezeichnung, Bild, Preis)
router.get('/', async (req, res) => {
  const produkte = await pool.query(
    `SELECT id, bezeichnung, preis, bild_pfad AS bildPfad
       FROM produkt
      WHERE aktiv = TRUE
      ORDER BY bezeichnung`
  );
  res.json(produkte);
});

// GET /api/produkte/:id  -> ein Produkt mit ALLEN Eigenschaften
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ fehler: 'Ungültige ID' });

  // Prepared Statement (?) schützt vor SQL-Injection
  const [produkt] = await pool.query(
    `SELECT id, bezeichnung, beschreibung, preis, bild_pfad AS bildPfad
       FROM produkt WHERE id = ? AND aktiv = TRUE`,
    [id]
  );
  if (!produkt) return res.status(404).json({ fehler: 'Produkt nicht gefunden' });

  produkt.eigenschaften = await pool.query(
    'SELECT name, wert FROM produkteigenschaft WHERE produkt_id = ? ORDER BY id',
    [id]
  );
  res.json(produkt);
});

export default router;
