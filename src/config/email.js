/**
 * Configuration pour Nodemailer
 */
const nodemailer = require("nodemailer")
require("dotenv").config()

// Créer un transporteur réutilisable avec les paramètres SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true", // true pour 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    // Ne pas échouer sur les certificats invalides
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
})

// Vérifier la connexion au serveur SMTP au démarrage de l'application
const verifyConnection = async () => {
  try {
    await transporter.verify()
    console.log("Connexion au serveur SMTP établie")
    return true
  } catch (error) {
    console.error("Erreur de connexion au serveur SMTP:", error)
    return false
  }
}

module.exports = {
  transporter,
  verifyConnection,
  defaultFrom: process.env.EMAIL_FROM || "noreply@assurance-vie.com",
}
