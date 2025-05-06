const express = require("express")
const router = express.Router()
const { check } = require("express-validator")
const policeController = require("../controllers/policeController")
const { protect } = require("../middleware/auth")
const validate = require("../middleware/validate")

// Obtenir toutes les polices
router.get("/", protect, policeController.getPolices)

// Obtenir une police par son ID
router.get("/:id", protect, policeController.getPoliceById)

// Créer une nouvelle police
router.post(
  "/",
  protect,
  [
    check("dossierId", "L'ID du dossier est requis").isInt(),
    check("compagnieId", "L'ID de la compagnie est requis").isInt(),
    check("numeroPolice", "Le numéro de police est requis").notEmpty(),
    check("dateEffet", "La date d'effet est requise").notEmpty(),
    check("capitalAssure", "Le capital assuré est requis").isFloat({ min: 0 }),
    check("primeMensuelle", "La prime mensuelle est requise").isFloat({ min: 0 }),
    check("typeContrat", "Le type de contrat doit être individuel ou collectif").isIn(["individuel", "collectif"]),
    check("statut", "Le statut doit être actif, suspendu ou résilié").optional().isIn(["actif", "suspendu", "résilié"]),
  ],
  validate,
  policeController.createPolice,
)

// Mettre à jour une police
router.put(
  "/:id",
  protect,
  [
    check("capitalAssure", "Le capital assuré doit être positif").optional().isFloat({ min: 0 }),
    check("primeMensuelle", "La prime mensuelle doit être positive").optional().isFloat({ min: 0 }),
    check("statut", "Le statut doit être actif, suspendu ou résilié").optional().isIn(["actif", "suspendu", "résilié"]),
  ],
  validate,
  policeController.updatePolice,
)

// Supprimer une police
router.delete("/:id", protect, policeController.deletePolice)

module.exports = router
