import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

// Zusatzaufgabe 9: Konto unabhängig von einer Bestellung erstellen
@Component({
  selector: 'app-registrieren',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './registrieren.html',
  styleUrl: '../auth-formular.scss',
})
export class Registrieren {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);

  protected fehler = signal('');
  protected form = this.fb.group({
    vorname: ['', Validators.required],
    nachname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefon: ['', [Validators.required, Validators.pattern(/^[+0-9 /()-]{6,30}$/)]],
    passwort: ['', [Validators.required, Validators.minLength(8)]],
  });

  registrieren() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.auth.registrieren(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: HttpErrorResponse) => this.fehler.set(err.error?.fehler ?? 'Registrierung fehlgeschlagen'),
    });
  }
}
