const express = require("express")
const router = express.Router()
const { check } = require("express-validator")
const dossierController = require("../controllers/dossierController")
const { protect } = require("../middleware/auth")
const validate = require("../middleware/validate")

// Obtenir tous les dossiers
router.get("/", protect, dossierController.getDossiers)

// Obtenir un dossier par son ID
router.get("/:id", protect, dossierController.getDossierById)

// Créer un nouveau dossier
router.post(
  "/",
  protect,
  [
    check("employeId", "L'ID de l'employé est requis").isInt(),
    check("conseillerId", "L'ID du conseiller est requis").optional().isInt(),
    check("statut", "Le statut doit être en_cours, complet, incomplet ou archivé")
      .optional()
      .isIn(["en_cours", "complet", "incomplet", "archivé"]),
  ],
  validate,
  dossierController.createDossier,
)

// Mettre à jour un dossier
router.put(
  "/:id",
  protect,
  [
    check("statut", "Le statut doit être en_cours, complet, incomplet ou archivé")
      .optional()
      .isIn(["en_cours", "complet", "incomplet", "archivé"]),
  ],
  validate,
  dossierController.updateDossier,
)

// Supprimer un dossier
router.delete("/:id", protect, dossierController.deleteDossier)

module.exports = router
