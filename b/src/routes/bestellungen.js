// Routen für Bestellungen (Aufgaben 3 und 4)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authErforderlich, authOptional, erstelleToken } from '../middleware/auth.js';
import { pruefeBestellung } from '../validierung.js';
import { ladeRechnung, rechnungAlsHtml } from '../services/rechnung.js';
import { sendeMail } from '../services/mail.js';

const router = Router();

/*
 POST /api/bestellungen
 Body:
 {
   kunde: { vorname, nachname, email, telefon },
   rechnungsadresse: { strasse, plz, ort, land },
   lieferadresse: { ... } | null,     // null = wie Rechnungsadresse
   zahlungsart: 'rechnung' | 'kreditkarte',
   positionen: [{ produktId, menge }],
   kontoErstellen: true | false,      // Zusatzaufgabe: Konto anlegen
   passwort: '...'                    // nur wenn kontoErstellen
 }
*/
router.post('/', authOptional, async (req, res) => {
  const fehler = pruefeBestellung(req.body);
  if (fehler.length) return res.status(400).json({ fehler: fehler.join(', ') });

  const { kunde, rechnungsadresse, zahlungsart, kontoErstellen, passwort } = req.body;
  const lieferadresse = req.body.lieferadresse ?? rechnungsadresse;
  const email = kunde.email.trim().toLowerCase();

  // Gleiche Produkte im Warenkorb zusammenfassen (Primärschlüssel bestellung_id+produkt_id!)
  const mengen = new Map();
  for (const p of req.body.positionen) {
    mengen.set(p.produktId, (mengen.get(p.produktId) ?? 0) + p.menge);
  }

  // Preise IMMER aus der DB holen – nie dem Preis aus dem Frontend vertrauen!
  const ids = [...mengen.keys()];
  const platzhalter = ids.map(() => '?').join(',');
  const produkte = await pool.query(
    `SELECT id, preis FROM produkt WHERE aktiv = TRUE AND id IN (${platzhalter})`,
    ids
  );
  if (produkte.length !== ids.length) {
    return res.status(400).json({ fehler: 'Ein Produkt im Warenkorb existiert nicht mehr' });
  }
  const gesamt = produkte.reduce((summe, p) => summe + p.preis * mengen.get(p.id), 0);
  const gesamtbetrag = Math.round(gesamt * 100) / 100;

  // Transaktion: entweder ALLES wird gespeichert oder NICHTS
  const conn = await pool.getConnection();
  let bestellungId;
  let token = null;
  try {
    await conn.beginTransaction();

    // 1) Kunde bestimmen bzw. anlegen
    let kundeId;
    if (req.kundeId) {
      // eingeloggt -> vorhandenen Kunden verwenden, Daten aktualisieren
      kundeId = req.kundeId;
      await conn.query(
        'UPDATE kunde SET vorname = ?, nachname = ?, telefon = ? WHERE id = ?',
        [kunde.vorname.trim(), kunde.nachname.trim(), kunde.telefon.trim(), kundeId]
      );
    } else {
      let hash = null;
      if (kontoErstellen) {
        const [vorhanden] = await conn.query(
          'SELECT id FROM kunde WHERE email = ? AND passwort_hash IS NOT NULL',
          [email]
        );
        if (vorhanden) {
          await conn.rollback();
          return res.status(409).json({ fehler: 'Für diese E-Mail gibt es bereits ein Konto – bitte anmelden' });
        }
        hash = await bcrypt.hash(passwort, 10);
      }
      const k = await conn.query(
        'INSERT INTO kunde (vorname, nachname, email, telefon, passwort_hash) VALUES (?, ?, ?, ?, ?)',
        [kunde.vorname.trim(), kunde.nachname.trim(), email, kunde.telefon.trim(), hash]
      );
      kundeId = k.insertId;
      if (kontoErstellen) token = erstelleToken(kundeId);
    }

    // 2) Adressen speichern
    const adresseSql =
      'INSERT INTO adresse (kunde_id, typ, strasse, plz, ort, land) VALUES (?, ?, ?, ?, ?, ?)';
    const ra = await conn.query(adresseSql, [
      kundeId, 'rechnung', rechnungsadresse.strasse.trim(), rechnungsadresse.plz.trim(),
      rechnungsadresse.ort.trim(), rechnungsadresse.land?.trim() || 'Österreich',
    ]);
    const la = await conn.query(adresseSql, [
      kundeId, 'liefer', lieferadresse.strasse.trim(), lieferadresse.plz.trim(),
      lieferadresse.ort.trim(), lieferadresse.land?.trim() || 'Österreich',
    ]);

    // 3) Bestellkopf
    const b = await conn.query(
      `INSERT INTO bestellung (kunde_id, rechnungsadresse_id, lieferadresse_id, zahlungsart, gesamtbetrag)
       VALUES (?, ?, ?, ?, ?)`,
      [kundeId, ra.insertId, la.insertId, zahlungsart, gesamtbetrag]
    );
    bestellungId = b.insertId;

    // 4) Positionen (Einzelpreis zum Bestellzeitpunkt mitspeichern)
    for (const p of produkte) {
      await conn.query(
        'INSERT INTO bestellposition (bestellung_id, produkt_id, menge, einzelpreis) VALUES (?, ?, ?, ?)',
        [bestellungId, p.id, mengen.get(p.id), p.preis]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err; // Express 5 leitet den Fehler an den Error-Handler weiter
  } finally {
    conn.release(); // Verbindung zurück in den Pool!
  }

  // 5) Rechnung erstellen und per Mail senden.
  //    Fehler beim Mailversand sollen die (schon gespeicherte) Bestellung nicht abbrechen.
  const rechnung = await ladeRechnung(bestellungId);
  try {
    rechnung.mailGesendet = await sendeMail(
      email,
      `Ihre Rechnung ${rechnung.rechnungsnummer}`,
      rechnungAlsHtml(rechnung)
    );
  } catch (err) {
    console.error('Mailversand fehlgeschlagen:', err.message);
    rechnung.mailGesendet = false;
  }

  res.status(201).json({ rechnung, token });
});

// GET /api/bestellungen/:id/rechnung -> Rechnung erneut anzeigen.
// Nur für eingeloggte Kunden und nur die EIGENEN Bestellungen.
router.get('/:id/rechnung', authErforderlich, async (req, res) => {
  const rechnung = await ladeRechnung(Number(req.params.id));
  if (!rechnung || rechnung.kundeId !== req.kundeId) {
    return res.status(404).json({ fehler: 'Rechnung nicht gefunden' });
  }
  res.json(rechnung);
});

export default router;
