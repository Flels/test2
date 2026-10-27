import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WarenkorbService } from '../../services/warenkorb.service';
import { BestellungService } from '../../services/bestellung.service';
import { AuthService } from '../../services/auth.service';
import { Adresse, BestellAnfrage, Zahlungsart } from '../../models';

// Aufgabe 3b/3c + Zusatzaufgabe 9: Kundendaten, Adressen, Zahlungsart, optional Konto erstellen
@Component({
  selector: 'app-kasse',
  imports: [
    ReactiveFormsModule, RouterLink, CurrencyPipe, NgTemplateOutlet, MatCardModule, MatFormFieldModule, MatInputModule,
    MatRadioModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './kasse.html',
  styleUrl: './kasse.scss',
})
export class Kasse implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  protected warenkorb = inject(WarenkorbService);
  protected auth = inject(AuthService);
  private bestellungService = inject(BestellungService);

  protected sendet = signal(false);
  protected fehler = signal('');
  // als Signal, damit sich das Template sicher aktualisiert (auch bei patchValue aus dem Code)
  protected lieferGleich = signal(true);
  protected kontoErstellen = signal(false);

  // Hilfsfunktion: eine Adress-Gruppe (für Rechnung und Lieferung gleich aufgebaut)
  private adresseGruppe() {
    return this.fb.group({
      strasse: ['', [Validators.required, Validators.maxLength(100)]],
      plz: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z -]{4,10}$/)]],
      ort: ['', [Validators.required, Validators.maxLength(60)]],
      land: ['Österreich', Validators.required],
    });
  }

  protected form = this.fb.group({
    kunde: this.fb.group({
      vorname: ['', [Validators.required, Validators.maxLength(50)]],
      nachname: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      telefon: ['', [Validators.required, Validators.pattern(/^[+0-9 /()-]{6,30}$/)]],
    }),
    rechnungsadresse: this.adresseGruppe(),
    lieferGleich: [true],
    lieferadresse: this.adresseGruppe(),
    zahlungsart: ['rechnung' as Zahlungsart, Validators.required],
    kontoErstellen: [false],
    passwort: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit() {
    // Deaktivierte Felder werden NICHT validiert -> Lieferadresse/Passwort nur bei Bedarf aktiv
    this.form.controls.lieferadresse.disable();
    this.form.controls.passwort.disable();

    this.form.controls.lieferGleich.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((gleich) => {
        this.lieferGleich.set(gleich);
        if (gleich) this.form.controls.lieferadresse.disable();
        else this.form.controls.lieferadresse.enable();
      });

    this.form.controls.kontoErstellen.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ja) => {
        this.kontoErstellen.set(ja);
        if (ja) this.form.controls.passwort.enable();
        else this.form.controls.passwort.disable();
      });

    // Zusatzaufgabe: eingeloggte Kunden müssen nichts erneut eingeben
    if (this.auth.eingeloggt()) {
      this.auth.ich().subscribe({
        next: (k) => {
          this.form.controls.kunde.patchValue(k);
          this.form.controls.kunde.controls.email.disable(); // E-Mail gehört zum Konto
          if (k.rechnungsadresse) this.form.controls.rechnungsadresse.patchValue(k.rechnungsadresse);
          if (k.lieferadresse && !this.gleicheAdresse(k.rechnungsadresse, k.lieferadresse)) {
            this.form.controls.lieferGleich.setValue(false);
            this.form.controls.lieferadresse.patchValue(k.lieferadresse);
          }
        },
        error: () => this.auth.logout(), // Token abgelaufen -> als Gast weiter
      });
    }
  }

  bestellen() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // zeigt alle Fehlermeldungen an
      return;
    }
    // getRawValue() liefert auch deaktivierte Felder (z. B. E-Mail beim eingeloggten Kunden)
    const w = this.form.getRawValue();
    const anfrage: BestellAnfrage = {
      kunde: w.kunde,
      rechnungsadresse: w.rechnungsadresse,
      lieferadresse: w.lieferGleich ? null : w.lieferadresse,
      zahlungsart: w.zahlungsart,
      positionen: this.warenkorb.positionen().map((p) => ({ produktId: p.produkt.id, menge: p.menge })),
      kontoErstellen: !this.auth.eingeloggt() && w.kontoErstellen,
      passwort: w.kontoErstellen ? w.passwort : undefined,
    };

    this.sendet.set(true);
    this.fehler.set('');
    this.bestellungService.bestellen(anfrage).subscribe({
      next: (antwort) => {
        if (antwort.token) this.auth.tokenSetzen(antwort.token); // neues Konto -> gleich eingeloggt
        this.warenkorb.leeren();
        this.router.navigateByUrl('/rechnung');
      },
      error: (err: HttpErrorResponse) => {
        this.fehler.set(err.error?.fehler ?? 'Bestellung fehlgeschlagen. Bitte später erneut versuchen.');
        this.sendet.set(false);
      },
    });
  }

  private gleicheAdresse(a: Adresse | null, b: Adresse | null) {
    return !!a && !!b && a.strasse === b.strasse && a.plz === b.plz && a.ort === b.ort && a.land === b.land;
  }
}
