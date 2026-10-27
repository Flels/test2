// Datenbankverbindung: ein Connection-Pool für die ganze App.
// Ein Pool hält mehrere Verbindungen offen und verteilt sie auf die Requests.
import mariadb from 'mariadb';

export const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  // MariaDB liefert IDs/COUNT als BigInt und DECIMAL als String.
  // Für JSON-Antworten wollen wir normale JavaScript-Zahlen:
  bigIntAsNumber: true,
  insertIdAsNumber: true,
  decimalAsNumber: true,
});
