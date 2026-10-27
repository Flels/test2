import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from '../config';
import { EingeloggterKunde, Kundendaten } from '../models';

const TOKEN_KEY = 'token';

// Kundenkonto (Zusatzaufgabe): Login-Token speichern und Kundendaten laden
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly token = signal<string | null>(this.leseToken());
  readonly eingeloggt = computed(() => this.token() !== null);

  registrieren(daten: Kundendaten & { passwort: string }) {
    return this.http
      .post<{ token: string }>(`${API_URL}/auth/registrieren`, daten)
      .pipe(tap((r) => this.tokenSetzen(r.token)));
  }

  login(email: string, passwort: string) {
    return this.http
      .post<{ token: string }>(`${API_URL}/auth/login`, { email, passwort })
      .pipe(tap((r) => this.tokenSetzen(r.token)));
  }

  ich() {
    return this.http.get<EingeloggterKunde>(`${API_URL}/auth/ich`);
  }

  logout() {
    this.tokenSetzen(null);
  }

  tokenSetzen(token: string | null) {
    this.token.set(token);
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignorieren */
    }
  }

  private leseToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
