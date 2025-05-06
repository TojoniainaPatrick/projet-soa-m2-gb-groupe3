const express = require("express")
const router = express.Router()

const authRoutes = require("./authRoutes")
const employeRoutes = require("./employeRoutes")
const conseillerRoutes = require("./conseillerRoutes")
const dossierRoutes = require("./dossierRoutes")
const beneficiaireRoutes = require("./beneficiaireRoutes")
const policeRoutes = require("./policeRoutes")
const compagnieRoutes = require("./compagnieRoutes")
const notificationRoutes = require("./notificationRoutes")

// Regrouper toutes les routes
router.use("/auth", authRoutes)
router.use("/employes", employeRoutes)
router.use("/conseillers", conseillerRoutes)
router.use("/dossiers", dossierRoutes)
router.use("/beneficiaires", beneficiaireRoutes)
router.use("/polices", policeRoutes)
router.use("/compagnies", compagnieRoutes)
router.use("/notifications", notificationRoutes)

module.exports = router
