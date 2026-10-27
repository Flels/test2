import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BestellungService } from '../../services/bestellung.service';

// Aufgabe 4: Rechnung nach der Bestellung anzeigen (wird zusätzlich per Mail gesendet)
@Component({
  selector: 'app-rechnung',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './rechnung.html',
  styleUrl: './rechnung.scss',
})
export class RechnungSeite {
  protected rechnung = inject(BestellungService).letzteRechnung;

  drucken() {
    window.print();
  }
}
