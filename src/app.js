const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
require("dotenv").config()

const { clientsDB, assurancesDB } = require("./models/models")
const routes = require("./routes/index")
const errorMiddleware = require("./middleware/error")
const { verifyConnection } = require("./config/email")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

// Routes
app.use("/api", routes)

// Page d'accueil
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API de gestion d'assurance-vie",
    status: "online",
    version: "1.0.0",
  })
})

// Middleware de gestion d'erreurs
app.use(errorMiddleware)

// Lancement du serveur
const startServer = async () => {
  try {
    // Synchronisation avec les bases de données
    await clientsDB.authenticate()
    console.log("Connexion à la base de données clients établie.")

    await assurancesDB.authenticate()
    console.log("Connexion à la base de données assurances établie.")

    // Vérifier la connexion au serveur SMTP
    await verifyConnection()

    // En développement, on peut synchroniser les modèles (à éviter en production)
    if (process.env.NODE_ENV === "development") {
      await clientsDB.sync({ alter: true })
      console.log("Modèles clients synchronisés avec la base de données.")

      await assurancesDB.sync({ alter: true })
      console.log("Modèles assurances synchronisés avec la base de données.")
    }

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`)
    })
  } catch (error) {
    console.error("Impossible de démarrer le serveur:", error)
    process.exit(1)
  }
}

startServer()
