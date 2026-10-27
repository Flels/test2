import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, BACKEND_URL } from '../config';
import { Produkt, ProduktDetail } from '../models';

@Injectable({ providedIn: 'root' })
export class ProduktService {
  private http = inject(HttpClient);

  alleProdukte() {
    return this.http.get<Produkt[]>(`${API_URL}/produkte`);
  }

  produkt(id: number) {
    return this.http.get<ProduktDetail>(`${API_URL}/produkte/${id}`);
  }

  // DB speichert nur den Pfad, das Bild liefert das Backend aus
  bildUrl(bildPfad: string) {
    return `${BACKEND_URL}/${bildPfad}`;
  }
}
