// Auth-Middleware: liest das JWT aus dem Header "Authorization: Bearer <token>".
import jwt from 'jsonwebtoken';

// Hilfsfunktion: Token prüfen, liefert die Kunden-ID oder null
function kundeAusToken(req) {
  const header = req.headers.authorization ?? '';
  const [typ, token] = header.split(' ');
  if (typ !== 'Bearer' || !token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.kundeId;
  } catch {
    return null; // abgelaufen oder manipuliert
  }
}

// Route NUR für eingeloggte Kunden
export function authErforderlich(req, res, next) {
  const kundeId = kundeAusToken(req);
  if (!kundeId) return res.status(401).json({ fehler: 'Nicht angemeldet' });
  req.kundeId = kundeId;
  next();
}

// Login ist optional (z. B. Bestellung als Gast ODER als Kunde)
export function authOptional(req, res, next) {
  req.kundeId = kundeAusToken(req);
  next();
}

// Token für einen Kunden erstellen (7 Tage gültig)
export function erstelleToken(kundeId) {
  return jwt.sign({ kundeId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
