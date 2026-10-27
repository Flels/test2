import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from '../config';
import { BestellAnfrage, Rechnung, Statistik } from '../models';

@Injectable({ providedIn: 'root' })
export class BestellungService {
  private http = inject(HttpClient);

  // Die zuletzt erstellte Rechnung (für die Rechnungsseite nach dem Bestellen)
  readonly letzteRechnung = signal<Rechnung | null>(this.leseRechnung());

  bestellen(anfrage: BestellAnfrage) {
    return this.http
      .post<{ rechnung: Rechnung; token: string | null }>(`${API_URL}/bestellungen`, anfrage)
      .pipe(
        tap((r) => {
          this.letzteRechnung.set(r.rechnung);
          // sessionStorage: Rechnung bleibt beim Reload sichtbar, verschwindet beim Schließen des Tabs
          try {
            sessionStorage.setItem('rechnung', JSON.stringify(r.rechnung));
          } catch {
            /* ignorieren */
          }
        })
      );
  }

  statistik() {
    return this.http.get<Statistik>(`${API_URL}/statistik`);
  }

  private leseRechnung(): Rechnung | null {
    try {
      return JSON.parse(sessionStorage.getItem('rechnung') ?? 'null');
    } catch {
      return null;
    }
  }
}
