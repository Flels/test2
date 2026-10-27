-- =====================================================================
-- Webshop – Datenbank-Skript (MariaDB)
-- Erstellt Datenbank, Tabellen und Testdaten.
-- Ausführen:  mariadb -u root -p < webshop.sql
-- =====================================================================

SET NAMES utf8mb4; -- sonst werden Umlaute beim Import falsch gespeichert

DROP DATABASE IF EXISTS webshop;
CREATE DATABASE webshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE webshop;

-- ---------------------------------------------------------------------
-- Produkt: Stammdaten. Bild liegt im Dateisystem, nur der Pfad in der DB.
-- ---------------------------------------------------------------------
CREATE TABLE produkt (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  bezeichnung  VARCHAR(100)  NOT NULL,
  beschreibung TEXT          NULL,
  preis        DECIMAL(10,2) NOT NULL CHECK (preis >= 0),
  bild_pfad    VARCHAR(255)  NOT NULL,          -- z. B. 'bilder/kaffee.svg'
  aktiv        BOOLEAN       NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- Produkteigenschaft: beliebig viele Eigenschaften pro Produkt (1:n).
-- Flexibel statt fixer Spalten (Farbe, Gewicht, Material ...).
-- ---------------------------------------------------------------------
CREATE TABLE produkteigenschaft (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  produkt_id INT UNSIGNED NOT NULL,
  name       VARCHAR(50)  NOT NULL,
  wert       VARCHAR(100) NOT NULL,
  CONSTRAINT fk_eigenschaft_produkt FOREIGN KEY (produkt_id)
    REFERENCES produkt(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Kunde: Gast ODER registriert. passwort_hash = NULL -> Gastbestellung.
-- ---------------------------------------------------------------------
CREATE TABLE kunde (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vorname       VARCHAR(50)  NOT NULL,
  nachname      VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  telefon       VARCHAR(30)  NOT NULL,
  passwort_hash VARCHAR(255) NULL,
  erstellt_am   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Eine E-Mail darf nur EIN Konto haben, Gäste dürfen öfter vorkommen.
-- (Eindeutigkeit wird im Backend bei der Registrierung geprüft.)
CREATE INDEX idx_kunde_email ON kunde(email);

-- ---------------------------------------------------------------------
-- Adresse: gehört zu einem Kunden. Typ = Rechnung oder Lieferung.
-- ---------------------------------------------------------------------
CREATE TABLE adresse (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kunde_id  INT UNSIGNED NOT NULL,
  typ       ENUM('rechnung','liefer') NOT NULL,
  strasse   VARCHAR(100) NOT NULL,
  plz       VARCHAR(10)  NOT NULL,
  ort       VARCHAR(60)  NOT NULL,
  land      VARCHAR(60)  NOT NULL DEFAULT 'Österreich',
  CONSTRAINT fk_adresse_kunde FOREIGN KEY (kunde_id)
    REFERENCES kunde(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Bestellung = Rechnungskopf.
-- ---------------------------------------------------------------------
CREATE TABLE bestellung (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kunde_id            INT UNSIGNED  NOT NULL,
  rechnungsadresse_id INT UNSIGNED  NOT NULL,
  lieferadresse_id    INT UNSIGNED  NOT NULL,
  bestelldatum        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  zahlungsart         ENUM('rechnung','kreditkarte') NOT NULL,
  gesamtbetrag        DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_bestellung_kunde FOREIGN KEY (kunde_id) REFERENCES kunde(id),
  CONSTRAINT fk_bestellung_rechnungsadr FOREIGN KEY (rechnungsadresse_id) REFERENCES adresse(id),
  CONSTRAINT fk_bestellung_lieferadr FOREIGN KEY (lieferadresse_id) REFERENCES adresse(id)
);

-- ---------------------------------------------------------------------
-- Bestellposition: löst die n:m-Beziehung Bestellung <-> Produkt auf.
-- Einzelpreis wird gespeichert, damit alte Rechnungen bei Preisänderung
-- gleich bleiben.
-- ---------------------------------------------------------------------
CREATE TABLE bestellposition (
  bestellung_id INT UNSIGNED  NOT NULL,
  produkt_id    INT UNSIGNED  NOT NULL,
  menge         INT UNSIGNED  NOT NULL CHECK (menge > 0),
  einzelpreis   DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (bestellung_id, produkt_id),
  CONSTRAINT fk_position_bestellung FOREIGN KEY (bestellung_id)
    REFERENCES bestellung(id) ON DELETE CASCADE,
  CONSTRAINT fk_position_produkt FOREIGN KEY (produkt_id)
    REFERENCES produkt(id)
);

-- =====================================================================
-- Testdaten
-- =====================================================================
INSERT INTO produkt (bezeichnung, beschreibung, preis, bild_pfad) VALUES
('Kaffeebohnen Espresso', 'Kräftige Röstung aus Kärnten, ideal für Siebträger.', 14.90, 'bilder/kaffee.svg'),
('Keramiktasse',          'Handgemachte Tasse, spülmaschinenfest.',              12.50, 'bilder/tasse.svg'),
('French Press',          'Edelstahl-Kaffeebereiter für 4 Tassen.',              34.00, 'bilder/frenchpress.svg'),
('Teemischung Alpenkräuter','Bio-Kräutertee aus heimischen Kräutern.',             8.90, 'bilder/tee.svg'),
('Thermosflasche',        'Hält Getränke 12 Stunden heiß.',                       24.90, 'bilder/flasche.svg'),
('Milchaufschäumer',      'Elektrischer Aufschäumer mit Akku.',                   19.90, 'bilder/aufschaeumer.svg'),
('Kaffeemühle',           'Manuelle Mühle mit Keramikmahlwerk.',                  39.00, 'bilder/muehle.svg');

INSERT INTO produkteigenschaft (produkt_id, name, wert) VALUES
(1,'Gewicht','500 g'),(1,'Röstgrad','dunkel'),(1,'Herkunft','Brasilien/Äthiopien'),
(2,'Volumen','300 ml'),(2,'Farbe','Steingrau'),(2,'Material','Keramik'),
(3,'Volumen','1 l'),(3,'Material','Edelstahl'),
(4,'Gewicht','100 g'),(4,'Bio','ja'),
(5,'Volumen','750 ml'),(5,'Farbe','Schwarz'),(5,'Material','Edelstahl'),
(6,'Akku','USB-C'),(6,'Farbe','Silber'),
(7,'Mahlwerk','Keramik'),(7,'Mahlgrade','18');

-- Ein Testkunde (Gast) mit zwei Bestellungen, damit die Statistik Daten hat
INSERT INTO kunde (vorname, nachname, email, telefon) VALUES
('Max', 'Muster', 'max@example.com', '+43 660 1234567');

INSERT INTO adresse (kunde_id, typ, strasse, plz, ort) VALUES
(1, 'rechnung', 'Hauptplatz 1', '9020', 'Klagenfurt'),
(1, 'liefer',   'Hauptplatz 1', '9020', 'Klagenfurt');

INSERT INTO bestellung (kunde_id, rechnungsadresse_id, lieferadresse_id, bestelldatum, zahlungsart, gesamtbetrag) VALUES
(1, 1, 2, NOW() - INTERVAL 3 DAY,  'rechnung',    54.70),
(1, 1, 2, NOW() - INTERVAL 40 DAY, 'kreditkarte', 34.00);

INSERT INTO bestellposition (bestellung_id, produkt_id, menge, einzelpreis) VALUES
(1, 1, 2, 14.90), (1, 5, 1, 24.90),
(2, 3, 1, 34.00);

-- ---------------------------------------------------------------------
-- Eigener DB-Benutzer für das Backend (nicht root verwenden!)
-- Passwort muss mit DB_PASSWORD in backend/.env übereinstimmen.
-- ---------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'webshop'@'localhost' IDENTIFIED BY 'webshop123';
GRANT SELECT, INSERT, UPDATE, DELETE ON webshop.* TO 'webshop'@'localhost';
FLUSH PRIVILEGES;
