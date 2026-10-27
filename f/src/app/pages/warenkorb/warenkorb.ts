import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { WarenkorbService } from '../../services/warenkorb.service';
import { ProduktService } from '../../services/produkt.service';

// Aufgabe 3a: Warenkorb anzeigen, Mengen ändern, Positionen entfernen
@Component({
  selector: 'app-warenkorb',
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './warenkorb.html',
  styleUrl: './warenkorb.scss',
})
export class Warenkorb {
  protected warenkorb = inject(WarenkorbService);
  protected produktService = inject(ProduktService);
}
