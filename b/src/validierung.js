// Einfache Eingabeprüfung – NIE dem Frontend vertrauen, alles im Backend prüfen.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFON_REGEX = /^[+0-9 /()-]{6,30}$/;

function istText(wert, max = 100) {
  return typeof wert === 'string' && wert.trim().length > 0 && wert.length <= max;
}

function pruefeAdresse(adr, name, fehler) {
  if (!adr || typeof adr !== 'object') {
    fehler.push(`${name} fehlt`);
    return;
  }
  if (!istText(adr.strasse)) fehler.push(`${name}: Straße fehlt`);
  if (!istText(adr.plz, 10)) fehler.push(`${name}: PLZ fehlt`);
  if (!istText(adr.ort, 60)) fehler.push(`${name}: Ort fehlt`);
}

// Kundendaten (für Registrierung UND Bestellung)
export function pruefeKunde(k, fehler) {
  if (!k || typeof k !== 'object') {
    fehler.push('Kundendaten fehlen');
    return;
  }
  if (!istText(k.vorname, 50)) fehler.push('Vorname fehlt');
  if (!istText(k.nachname, 50)) fehler.push('Nachname fehlt');
  if (!EMAIL_REGEX.test(k.email ?? '')) fehler.push('E-Mail ungültig');
  if (!TELEFON_REGEX.test(k.telefon ?? '')) fehler.push('Telefonnummer ungültig');
}

// Gesamter Bestell-Request. Gibt ein Array mit Fehlermeldungen zurück.
export function pruefeBestellung(body) {
  const fehler = [];
  pruefeKunde(body.kunde, fehler);
  pruefeAdresse(body.rechnungsadresse, 'Rechnungsadresse', fehler);
  // Lieferadresse ist optional: leer = gleich wie Rechnungsadresse
  if (body.lieferadresse) pruefeAdresse(body.lieferadresse, 'Lieferadresse', fehler);

  if (!['rechnung', 'kreditkarte'].includes(body.zahlungsart)) {
    fehler.push('Zahlungsart ungültig');
  }

  if (!Array.isArray(body.positionen) || body.positionen.length === 0) {
    fehler.push('Warenkorb ist leer');
  } else {
    for (const p of body.positionen) {
      if (!Number.isInteger(p.produktId) || !Number.isInteger(p.menge) || p.menge < 1 || p.menge > 99) {
        fehler.push('Ungültige Position im Warenkorb');
        break;
      }
    }
  }

  if (body.kontoErstellen && (typeof body.passwort !== 'string' || body.passwort.length < 8)) {
    fehler.push('Passwort muss mindestens 8 Zeichen haben');
  }
  return fehler;
}
