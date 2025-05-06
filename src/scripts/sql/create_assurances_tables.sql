-- Création des tables pour la base assurances

-- Table des compagnies d'assurance
CREATE TABLE IF NOT EXISTS compagnies_assurance (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL UNIQUE,
  adresse VARCHAR(255),
  "codePostal" VARCHAR(20),
  ville VARCHAR(100),
  pays VARCHAR(100) DEFAULT 'France',
  telephone VARCHAR(20),
  email VARCHAR(255),
  "siteWeb" VARCHAR(255),
  logo VARCHAR(255),
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Table des polices d'assurance vie
CREATE TABLE IF NOT EXISTS polices_assurance_vie (
  id SERIAL PRIMARY KEY,
  "dossierId" INTEGER NOT NULL,
  "compagnieId" INTEGER NOT NULL REFERENCES compagnies_assurance(id),
  "numeroPolice" VARCHAR(50) NOT NULL UNIQUE,
  "dateEffet" DATE NOT NULL,
  "dateExpiration" DATE,
  "capitalAssure" DECIMAL(15, 2) NOT NULL,
  "primeMensuelle" DECIMAL(10, 2) NOT NULL,
  "typeContrat" VARCHAR(20) NOT NULL,
  statut VARCHAR(20) DEFAULT 'actif',
  "clauseBeneficiaire" TEXT,
  options JSONB,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Table des bénéficiaires
CREATE TABLE IF NOT EXISTS beneficiaires (
  id SERIAL PRIMARY KEY,
  "policeId" INTEGER NOT NULL REFERENCES polices_assurance_vie(id),
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  "dateNaissance" DATE,
  "lienParente" VARCHAR(100),
  pourcentage DECIMAL(5, 2) NOT NULL,
  ordre INTEGER,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Création des séquences
SELECT setval('compagnies_assurance_id_seq', (SELECT MAX(id) FROM compagnies_assurance));
SELECT setval('polices_assurance_vie_id_seq', (SELECT MAX(id) FROM polices_assurance_vie));
SELECT setval('beneficiaires_id_seq', (SELECT MAX(id) FROM beneficiaires));
