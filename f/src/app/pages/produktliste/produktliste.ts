import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProduktService } from '../../services/produkt.service';
import { WarenkorbService } from '../../services/warenkorb.service';
import { Produkt } from '../../models';

// Aufgabe 2a: Auflistung aller Produkte mit Bezeichnung und Bild
@Component({
  selector: 'app-produktliste',
  imports: [RouterLink, CurrencyPipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './produktliste.html',
  styleUrl: './produktliste.scss',
})
export class Produktliste implements OnInit {
  protected produktService = inject(ProduktService);
  private warenkorb = inject(WarenkorbService);
  private snackBar = inject(MatSnackBar);

  protected produkte = signal<Produkt[]>([]);
  protected laedt = signal(true);
  protected fehler = signal('');

  ngOnInit() {
    this.produktService.alleProdukte().subscribe({
      next: (daten) => {
        this.produkte.set(daten);
        this.laedt.set(false);
      },
      error: () => {
        this.fehler.set('Produkte konnten nicht geladen werden. Läuft das Backend?');
        this.laedt.set(false);
      },
    });
  }

  inDenWarenkorb(produkt: Produkt) {
    this.warenkorb.hinzufuegen(produkt);
    // kurzes Feedback für den Benutzer (Usability)
    this.snackBar.open(`${produkt.bezeichnung} im Warenkorb`, 'OK', { duration: 2000 });
  }
}
