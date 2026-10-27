// Rechnung: Daten aus der DB laden und als HTML (für die E-Mail) aufbereiten.
import { pool } from '../db.js';

const UST_SATZ = 0.2; // 20 % USt (Österreich), Preise sind Bruttopreise

// Alle Daten einer Bestellung für die Rechnung holen
export async function ladeRechnung(bestellungId) {
  const [kopf] = await pool.query(
    `SELECT b.id, b.bestelldatum, b.zahlungsart, b.gesamtbetrag, b.kunde_id,
            k.vorname, k.nachname, k.email, k.telefon,
            ra.strasse AS r_strasse, ra.plz AS r_plz, ra.ort AS r_ort, ra.land AS r_land,
            la.strasse AS l_strasse, la.plz AS l_plz, la.ort AS l_ort, la.land AS l_land
       FROM bestellung b
       JOIN kunde k    ON k.id  = b.kunde_id
       JOIN adresse ra ON ra.id = b.rechnungsadresse_id
       JOIN adresse la ON la.id = b.lieferadresse_id
      WHERE b.id = ?`,
    [bestellungId]
  );
  if (!kopf) return null;

  const positionen = await pool.query(
    `SELECT p.id AS produktId, p.bezeichnung, bp.menge, bp.einzelpreis,
            bp.menge * bp.einzelpreis AS summe
       FROM bestellposition bp
       JOIN produkt p ON p.id = bp.produkt_id
      WHERE bp.bestellung_id = ?`,
    [bestellungId]
  );

  const brutto = kopf.gesamtbetrag;
  const netto = Math.round((brutto / (1 + UST_SATZ)) * 100) / 100;

  return {
    rechnungsnummer: `R-${new Date(kopf.bestelldatum).getFullYear()}-${String(kopf.id).padStart(5, '0')}`,
    bestellungId: kopf.id,
    kundeId: kopf.kunde_id,
    datum: kopf.bestelldatum,
    zahlungsart: kopf.zahlungsart,
    kunde: { vorname: kopf.vorname, nachname: kopf.nachname, email: kopf.email, telefon: kopf.telefon },
    rechnungsadresse: { strasse: kopf.r_strasse, plz: kopf.r_plz, ort: kopf.r_ort, land: kopf.r_land },
    lieferadresse: { strasse: kopf.l_strasse, plz: kopf.l_plz, ort: kopf.l_ort, land: kopf.l_land },
    positionen,
    netto,
    ust: Math.round((brutto - netto) * 100) / 100,
    brutto,
  };
}

// Benutzereingaben im HTML unschädlich machen (gegen HTML-Injection in der Mail)
function esc(text) {
  return String(text).replace(/[&<>"']/g, (z) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]
  );
}

const euro = (betrag) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(betrag);

// HTML für die Rechnungs-Mail
export function rechnungAlsHtml(r) {
  const zeilen = r.positionen
    .map(
      (p) => `<tr>
        <td style="padding:6px;border-bottom:1px solid #ddd">${esc(p.bezeichnung)}</td>
        <td style="padding:6px;border-bottom:1px solid #ddd;text-align:right">${p.menge}</td>
        <td style="padding:6px;border-bottom:1px solid #ddd;text-align:right">${euro(p.einzelpreis)}</td>
        <td style="padding:6px;border-bottom:1px solid #ddd;text-align:right">${euro(p.summe)}</td>
      </tr>`
    )
    .join('');

  const adr = (a) => `${esc(a.strasse)}<br>${esc(a.plz)} ${esc(a.ort)}<br>${esc(a.land)}`;

  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#222">
    <h2>Rechnung ${r.rechnungsnummer}</h2>
    <p>Datum: ${new Date(r.datum).toLocaleDateString('de-AT')}<br>
       Zahlungsart: ${r.zahlungsart === 'rechnung' ? 'Rechnung' : 'Kreditkarte'}</p>
    <table style="width:100%;margin-bottom:16px"><tr>
      <td style="vertical-align:top"><strong>Rechnungsadresse</strong><br>
        ${esc(r.kunde.vorname)} ${esc(r.kunde.nachname)}<br>${adr(r.rechnungsadresse)}</td>
      <td style="vertical-align:top"><strong>Lieferadresse</strong><br>${adr(r.lieferadresse)}</td>
    </tr></table>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f3f3f3">
        <th style="padding:6px;text-align:left">Produkt</th><th style="padding:6px;text-align:right">Menge</th>
        <th style="padding:6px;text-align:right">Einzelpreis</th><th style="padding:6px;text-align:right">Summe</th>
      </tr></thead>
      <tbody>${zeilen}</tbody>
    </table>
    <p style="text-align:right">Netto: ${euro(r.netto)}<br>
       zzgl. 20 % USt: ${euro(r.ust)}<br>
       <strong>Gesamt: ${euro(r.brutto)}</strong></p>
    <p>Vielen Dank für Ihre Bestellung!</p>
  </div>`;
}
