// Routen für die Statistik-Seite (Aufgabe 7)
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/statistik  -> alle drei Auswertungen in einer Antwort
router.get('/', async (req, res) => {
  // a) Die 5 am seltensten bestellten Produkte.
  //    LEFT JOIN + COALESCE, damit auch NIE bestellte Produkte (Menge 0) dabei sind!
  const seltenste = await pool.query(
    `SELECT p.id, p.bezeichnung, COALESCE(SUM(bp.menge), 0) AS menge
       FROM produkt p
       LEFT JOIN bestellposition bp ON bp.produkt_id = p.id
      GROUP BY p.id, p.bezeichnung
      ORDER BY menge ASC, p.bezeichnung
      LIMIT 5`
  );

  // b) Die 5 meistbestellten Produkte (nach verkaufter Stückzahl)
  const meiste = await pool.query(
    `SELECT p.id, p.bezeichnung, SUM(bp.menge) AS menge
       FROM produkt p
       JOIN bestellposition bp ON bp.produkt_id = p.id
      GROUP BY p.id, p.bezeichnung
      ORDER BY menge DESC, p.bezeichnung
      LIMIT 5`
  );

  // c) Alle Bestellungen der letzten 4 Wochen
  const letzteVierWochen = await pool.query(
    `SELECT b.id, b.bestelldatum, b.zahlungsart, b.gesamtbetrag,
            CONCAT(k.vorname, ' ', k.nachname) AS kunde
       FROM bestellung b
       JOIN kunde k ON k.id = b.kunde_id
      WHERE b.bestelldatum >= NOW() - INTERVAL 4 WEEK
      ORDER BY b.bestelldatum DESC`
  );

  res.json({ seltenste, meiste, letzteVierWochen });
});

export default router;
