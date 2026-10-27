// Datentypen – entsprechen den JSON-Antworten des Backends

export interface Produkt {
  id: number;
  bezeichnung: string;
  preis: number;
  bildPfad: string;
}

export interface Eigenschaft {
  name: string;
  wert: string;
}

export interface ProduktDetail extends Produkt {
  beschreibung: string | null;
  eigenschaften: Eigenschaft[];
}

export interface WarenkorbPosition {
  produkt: Produkt;
  menge: number;
}

export interface Adresse {
  strasse: string;
  plz: string;
  ort: string;
  land: string;
}

export interface Kundendaten {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
}

export type Zahlungsart = 'rechnung' | 'kreditkarte';

export interface BestellAnfrage {
  kunde: Kundendaten;
  rechnungsadresse: Adresse;
  lieferadresse: Adresse | null;
  zahlungsart: Zahlungsart;
  positionen: { produktId: number; menge: number }[];
  kontoErstellen: boolean;
  passwort?: string;
}

export interface Rechnung {
  rechnungsnummer: string;
  bestellungId: number;
  datum: string;
  zahlungsart: Zahlungsart;
  kunde: Kundendaten;
  rechnungsadresse: Adresse;
  lieferadresse: Adresse;
  positionen: { produktId: number; bezeichnung: string; menge: number; einzelpreis: number; summe: number }[];
  netto: number;
  ust: number;
  brutto: number;
  mailGesendet?: boolean;
}

export interface EingeloggterKunde extends Kundendaten {
  id: number;
  rechnungsadresse: Adresse | null;
  lieferadresse: Adresse | null;
}

export interface Statistik {
  seltenste: { id: number; bezeichnung: string; menge: number }[];
  meiste: { id: number; bezeichnung: string; menge: number }[];
  letzteVierWochen: {
    id: number;
    bestelldatum: string;
    zahlungsart: Zahlungsart;
    gesamtbetrag: number;
    kunde: string;
  }[];
}
