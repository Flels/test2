import { Injectable, computed, effect, signal } from '@angular/core';
import { Produkt, WarenkorbPosition } from '../models';

const SPEICHER_KEY = 'warenkorb';

// Warenkorb liegt nur im Browser (localStorage) – erst beim Bestellen geht er ans Backend.
@Injectable({ providedIn: 'root' })
export class WarenkorbService {
  // Signal = reaktiver Zustand; alle Komponenten aktualisieren sich automatisch
  readonly positionen = signal<WarenkorbPosition[]>(this.laden());

  // Abgeleitete Werte (computed) werden automatisch neu berechnet
  readonly anzahl = computed(() => this.positionen().reduce((s, p) => s + p.menge, 0));
  readonly summe = computed(() =>
    this.positionen().reduce((s, p) => s + p.produkt.preis * p.menge, 0)
  );

  constructor() {
    // Bei jeder Änderung speichern -> Warenkorb überlebt einen Seiten-Reload
    effect(() => {
      try {
        localStorage.setItem(SPEICHER_KEY, JSON.stringify(this.positionen()));
      } catch {
        /* Speicher nicht verfügbar – Warenkorb funktioniert trotzdem */
      }
    });
  }

  hinzufuegen(produkt: Produkt, menge = 1) {
    this.positionen.update((liste) => {
      const vorhanden = liste.find((p) => p.produkt.id === produkt.id);
      if (vorhanden) {
        // neues Array/Objekt erzeugen (nicht mutieren), damit das Signal die Änderung erkennt
        return liste.map((p) =>
          p.produkt.id === produkt.id ? { ...p, menge: Math.min(p.menge + menge, 99) } : p
        );
      }
      return [...liste, { produkt, menge }];
    });
  }

  mengeSetzen(produktId: number, menge: number) {
    if (menge < 1) return this.entfernen(produktId);
    this.positionen.update((liste) =>
      liste.map((p) => (p.produkt.id === produktId ? { ...p, menge: Math.min(menge, 99) } : p))
    );
  }

  entfernen(produktId: number) {
    this.positionen.update((liste) => liste.filter((p) => p.produkt.id !== produktId));
  }

  leeren() {
    this.positionen.set([]);
  }

  private laden(): WarenkorbPosition[] {
    try {
      return JSON.parse(localStorage.getItem(SPEICHER_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}
