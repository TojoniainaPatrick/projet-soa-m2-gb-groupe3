-- Création des tables pour la base clients

-- Table des employés
CREATE TABLE IF NOT EXISTS employes (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telephone VARCHAR(20),
  "dateNaissance" DATE NOT NULL,
  adresse VARCHAR(255),
  "codePostal" VARCHAR(20),
  ville VARCHAR(100),
  pays VARCHAR(100) DEFAULT 'France',
  "numeroSecuriteSociale" VARCHAR(20) UNIQUE,
  "dateEmbauche" DATE NOT NULL,
  statut VARCHAR(10) DEFAULT 'actif',
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Table des conseillers
CREATE TABLE IF NOT EXISTS conseillers (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'conseiller',
  statut VARCHAR(10) DEFAULT 'actif',
  "derniereConnexion" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Table des dossiers employés
CREATE TABLE IF NOT EXISTS dossiers_employes (
  id SERIAL PRIMARY KEY,
  "employeId" INTEGER NOT NULL REFERENCES employes(id),
  "conseillerId" INTEGER NOT NULL REFERENCES conseillers(id),
  reference VARCHAR(20) NOT NULL UNIQUE,
  statut VARCHAR(20) DEFAULT 'en_cours',
  "dateCreation" TIMESTAMP NOT NULL DEFAULT NOW(),
  "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Création des séquences
SELECT setval('employes_id_seq', (SELECT MAX(id) FROM employes));
SELECT setval('conseillers_id_seq', (SELECT MAX(id) FROM conseillers));
SELECT setval('dossiers_employes_id_seq', (SELECT MAX(id) FROM dossiers_employes));
