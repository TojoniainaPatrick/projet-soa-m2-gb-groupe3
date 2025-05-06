const express = require("express")
const router = express.Router()
const { check } = require("express-validator")
const conseillerController = require("../controllers/conseillerController")
const { protect } = require("../middleware/auth")
const validate = require("../middleware/validate")

// Obtenir tous les conseillers
router.get("/", protect, conseillerController.getConseillers)

// Obtenir un conseiller par son ID
router.get("/:id", protect, conseillerController.getConseillerById)

// Créer un nouveau conseiller
router.post(
  "/",
  [
    check("nom", "Le nom est requis").notEmpty(),
    check("prenom", "Le prénom est requis").notEmpty(),
    check("email", "Veuillez fournir un email valide").isEmail(),
    check("password", "Le mot de passe doit contenir au moins 6 caractères").isLength({ min: 6 }),
    check("role", "Le rôle doit être admin, conseiller ou gestionnaire")
      .optional()
      .isIn(["admin", "conseiller", "gestionnaire"]),
  ],
  validate,
  conseillerController.createConseiller,
)

// Mettre à jour un conseiller
router.put(
  "/:id",
  protect,
  [
    check("email", "Veuillez fournir un email valide").optional().isEmail(),
    check("password", "Le mot de passe doit contenir au moins 6 caractères").optional().isLength({ min: 6 }),
    check("role", "Le rôle doit être admin, conseiller ou gestionnaire")
      .optional()
      .isIn(["admin", "conseiller", "gestionnaire"]),
    check("statut", "Le statut doit être actif ou inactif").optional().isIn(["actif", "inactif"]),
  ],
  validate,
  conseillerController.updateConseiller,
)

// Supprimer un conseiller
router.delete("/:id", protect, conseillerController.deleteConseiller)

module.exports = router
