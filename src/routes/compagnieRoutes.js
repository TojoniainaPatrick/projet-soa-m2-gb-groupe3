const express = require("express")
const router = express.Router()
const { check } = require("express-validator")
const compagnieController = require("../controllers/compagnieController")
const { protect } = require("../middleware/auth")
const validate = require("../middleware/validate")

// Obtenir toutes les compagnies
router.get("/", protect, compagnieController.getCompagnies)

// Obtenir une compagnie par son ID
router.get("/:id", protect, compagnieController.getCompagnieById)

// Créer une nouvelle compagnie
router.post(
  "/",
  protect,
  [
    check("nom", "Le nom est requis").notEmpty(),
    check("email", "Veuillez fournir un email valide").optional().isEmail(),
  ],
  validate,
  compagnieController.createCompagnie,
)

// Mettre à jour une compagnie
router.put(
  "/:id",
  protect,
  [check("email", "Veuillez fournir un email valide").optional().isEmail()],
  validate,
  compagnieController.updateCompagnie,
)

// Supprimer une compagnie
router.delete("/:id", protect, compagnieController.deleteCompagnie)

module.exports = router
