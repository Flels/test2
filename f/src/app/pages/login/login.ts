import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

// Zusatzaufgabe 9: Anmelden
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: '../auth-formular.scss',
})
export class Login {
  // ?zurueck=/kasse -> nach dem Login wieder dorthin
  readonly zurueck = input<string>();

  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);

  protected fehler = signal('');
  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    passwort: ['', Validators.required],
  });

  anmelden() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, passwort } = this.form.getRawValue();
    this.auth.login(email, passwort).subscribe({
      // nur interne Pfade erlauben (kein Weiterleiten auf fremde Seiten)
      next: () => this.router.navigateByUrl(this.zurueck()?.startsWith('/') ? this.zurueck()! : '/'),
      error: (err: HttpErrorResponse) => this.fehler.set(err.error?.fehler ?? 'Anmeldung fehlgeschlagen'),
    });
  }
}
