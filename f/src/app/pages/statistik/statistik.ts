import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BestellungService } from '../../services/bestellung.service';
import { Statistik } from '../../models';

// Aufgabe 7: Statistik-Seite
@Component({
  selector: 'app-statistik',
  imports: [CurrencyPipe, DatePipe, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './statistik.html',
  styleUrl: './statistik.scss',
})
export class StatistikSeite implements OnInit {
  private bestellungService = inject(BestellungService);

  protected daten = signal<Statistik | null>(null);
  protected fehler = signal('');

  // höchster Wert -> 100 % Balkenbreite
  protected maxMeiste = computed(() => Math.max(1, ...(this.daten()?.meiste.map((p) => p.menge) ?? [])));
  protected maxSeltenste = computed(() => Math.max(1, ...(this.daten()?.seltenste.map((p) => p.menge) ?? [])));
  protected umsatz4Wochen = computed(() =>
    (this.daten()?.letzteVierWochen ?? []).reduce((s, b) => s + b.gesamtbetrag, 0)
  );

  ngOnInit() {
    this.bestellungService.statistik().subscribe({
      next: (d) => this.daten.set(d),
      error: () => this.fehler.set('Statistik konnte nicht geladen werden.'),
    });
  }
}
