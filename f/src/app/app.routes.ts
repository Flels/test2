import { Routes } from '@angular/router';

// loadComponent = Lazy Loading: Seite wird erst geladen, wenn man sie aufruft
export const routes: Routes = [
  { path: '', title: 'Produkte', loadComponent: () => import('./pages/produktliste/produktliste').then((m) => m.Produktliste) },
  { path: 'produkt/:id', title: 'Produktdetails', loadComponent: () => import('./pages/produkt-detail/produkt-detail').then((m) => m.ProduktDetailSeite) },
  { path: 'warenkorb', title: 'Warenkorb', loadComponent: () => import('./pages/warenkorb/warenkorb').then((m) => m.Warenkorb) },
  { path: 'kasse', title: 'Kasse', loadComponent: () => import('./pages/kasse/kasse').then((m) => m.Kasse) },
  { path: 'rechnung', title: 'Rechnung', loadComponent: () => import('./pages/rechnung/rechnung').then((m) => m.RechnungSeite) },
  { path: 'statistik', title: 'Statistik', loadComponent: () => import('./pages/statistik/statistik').then((m) => m.StatistikSeite) },
  { path: 'login', title: 'Anmelden', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  { path: 'registrieren', title: 'Konto erstellen', loadComponent: () => import('./pages/registrieren/registrieren').then((m) => m.Registrieren) },
  { path: '**', redirectTo: '' },
];
