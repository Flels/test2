import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProduktService } from '../../services/produkt.service';
import { WarenkorbService } from '../../services/warenkorb.service';
import { ProduktDetail } from '../../models';

// Aufgabe 2b: ein Produkt mit ALLEN Eigenschaften anzeigen
@Component({
  selector: 'app-produkt-detail',
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './produkt-detail.html',
  styleUrl: './produkt-detail.scss',
})
export class ProduktDetailSeite implements OnInit {
  // kommt automatisch aus der URL /produkt/:id (withComponentInputBinding)
  readonly id = input.required<string>();

  protected produktService = inject(ProduktService);
  private warenkorb = inject(WarenkorbService);
  private snackBar = inject(MatSnackBar);

  protected produkt = signal<ProduktDetail | null>(null);
  protected fehler = signal('');
  protected menge = signal(1);

  ngOnInit() {
    this.produktService.produkt(Number(this.id())).subscribe({
      next: (p) => this.produkt.set(p),
      error: () => this.fehler.set('Produkt nicht gefunden.'),
    });
  }

  mengeAendern(delta: number) {
    this.menge.update((m) => Math.min(99, Math.max(1, m + delta)));
  }

  inDenWarenkorb(p: ProduktDetail) {
    this.warenkorb.hinzufuegen(p, this.menge());
    this.snackBar.open(`${this.menge()} × ${p.bezeichnung} im Warenkorb`, 'OK', { duration: 2000 });
  }
}
