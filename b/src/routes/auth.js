// Routen für das Kundenkonto (Zusatzaufgabe 9)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authErforderlich, erstelleToken } from '../middleware/auth.js';
import { pruefeKunde } from '../validierung.js';

const router = Router();

// POST /api/auth/registrieren  { vorname, nachname, email, telefon, passwort }
router.post('/registrieren', async (req, res) => {
  const fehler = [];
  pruefeKunde(req.body, fehler);
  if (typeof req.body.passwort !== 'string' || req.body.passwort.length < 8) {
    fehler.push('Passwort muss mindestens 8 Zeichen haben');
  }
  if (fehler.length) return res.status(400).json({ fehler: fehler.join(', ') });

  const { vorname, nachname, email, telefon, passwort } = req.body;

  // Gibt es schon ein KONTO (mit Passwort) für diese E-Mail?
  const [vorhanden] = await pool.query(
    'SELECT id FROM kunde WHERE email = ? AND passwort_hash IS NOT NULL',
    [email]
  );
  if (vorhanden) return res.status(409).json({ fehler: 'Für diese E-Mail gibt es bereits ein Konto' });

  // Passwort NIE im Klartext speichern -> bcrypt-Hash (mit Salt)
  const hash = await bcrypt.hash(passwort, 10);
  const ergebnis = await pool.query(
    'INSERT INTO kunde (vorname, nachname, email, telefon, passwort_hash) VALUES (?, ?, ?, ?, ?)',
    [vorname.trim(), nachname.trim(), email.trim().toLowerCase(), telefon.trim(), hash]
  );

  res.status(201).json({ token: erstelleToken(ergebnis.insertId) });
});

// POST /api/auth/login  { email, passwort }
router.post('/login', async (req, res) => {
  const { email, passwort } = req.body ?? {};
  const [kunde] = await pool.query(
    'SELECT id, passwort_hash FROM kunde WHERE email = ? AND passwort_hash IS NOT NULL',
    [String(email ?? '').trim().toLowerCase()]
  );
  // Gleiche Fehlermeldung bei falscher E-Mail und falschem Passwort
  // -> Angreifer erfährt nicht, welche E-Mails registriert sind.
  if (!kunde || !(await bcrypt.compare(String(passwort ?? ''), kunde.passwort_hash))) {
    return res.status(401).json({ fehler: 'E-Mail oder Passwort falsch' });
  }
  res.json({ token: erstelleToken(kunde.id) });
});

// GET /api/auth/ich  -> Daten des eingeloggten Kunden + zuletzt verwendete Adressen
// Damit füllt das Frontend die Kasse automatisch aus.
router.get('/ich', authErforderlich, async (req, res) => {
  const [kunde] = await pool.query(
    'SELECT id, vorname, nachname, email, telefon FROM kunde WHERE id = ?',
    [req.kundeId]
  );
  if (!kunde) return res.status(404).json({ fehler: 'Kunde nicht gefunden' });

  const adressen = await pool.query(
    `SELECT typ, strasse, plz, ort, land FROM adresse
      WHERE kunde_id = ? ORDER BY id DESC`,
    [req.kundeId]
  );
  // jeweils die neueste Rechnungs- und Lieferadresse
  kunde.rechnungsadresse = adressen.find((a) => a.typ === 'rechnung') ?? null;
  kunde.lieferadresse = adressen.find((a) => a.typ === 'liefer') ?? null;
  res.json(kunde);
});

export default router;
