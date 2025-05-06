const express = require("express")
const router = express.Router()
const { check } = require("express-validator")
const beneficiaireController = require("../controllers/beneficiaireController")
const { protect } = require("../middleware/auth")
const validate = require("../middleware/validate")

// Obtenir tous les bénéficiaires d'une police
router.get("/police/:policeId", protect, beneficiaireController.getBeneficiaires)

// Obtenir un bénéficiaire par son ID
router.get("/:id", protect, beneficiaireController.getBeneficiaireById)

// Créer un nouveau bénéficiaire
router.post(
  "/",
  protect,
  [
    check("policeId", "L'ID de la police est requis").isInt(),
    check("nom", "Le nom est requis").notEmpty(),
    check("prenom", "Le prénom est requis").notEmpty(),
    check("pourcentage", "Le pourcentage est requis et doit être entre 0 et 100").isFloat({ min: 0, max: 100 }),
  ],
  validate,
  beneficiaireController.createBeneficiaire,
)

// Mettre à jour un bénéficiaire
router.put(
  "/:id",
  protect,
  [check("pourcentage", "Le pourcentage doit être entre 0 et 100").optional().isFloat({ min: 0, max: 100 })],
  validate,
  beneficiaireController.updateBeneficiaire,
)

// Supprimer un bénéficiaire
router.delete("/:id", protect, beneficiaireController.deleteBeneficiaire)

module.exports = router
