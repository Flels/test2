// E-Mail-Versand mit nodemailer.
// Ohne SMTP-Daten in .env wird die Mail nur in der Konsole ausgegeben
// (praktisch zum Testen/bei der Prüfung ohne echten Mailserver).
import nodemailer from 'nodemailer';

function erstelleTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // 465 = TLS, 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Fallback: Mail als JSON erzeugen statt senden
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = erstelleTransporter();

// Gibt true zurück, wenn die Mail wirklich verschickt wurde
export async function sendeMail(an, betreff, html) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Webshop <shop@example.com>',
    to: an,
    subject: betreff,
    html,
  });
  if (!process.env.SMTP_HOST) {
    console.log(`[Mail-Test] An: ${an} | Betreff: ${betreff} (kein SMTP konfiguriert, nicht gesendet)`);
    return false;
  }
  return true;
}
