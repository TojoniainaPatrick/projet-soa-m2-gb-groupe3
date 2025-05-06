const express = require("express")
const router = express.Router()
const { check } = require("express-validator")
const employeController = require("../controllers/employeController")
const { protect } = require("../middleware/auth")
const validate = require("../middleware/validate")

// Obtenir tous les employés
router.get("/", protect, employeController.getEmployes)

// Obtenir un employé par son ID
router.get("/:id", protect, employeController.getEmployeById)

// Créer un nouvel employé
router.post(
  "/",
  protect,
  [
    check("nom", "Le nom est requis").notEmpty(),
    check("prenom", "Le prénom est requis").notEmpty(),
    check("email", "Veuillez fournir un email valide").isEmail(),
    check("dateNaissance", "La date de naissance est requise").notEmpty(),
    check("dateEmbauche", "La date d'embauche est requise").notEmpty(),
  ],
  validate,
  employeController.createEmploye,
)

// Mettre à jour un employé
router.put(
  "/:id",
  protect,
  [check("email", "Veuillez fournir un email valide").optional().isEmail()],
  validate,
  employeController.updateEmploye,
)

// Supprimer un employé
router.delete("/:id", protect, employeController.deleteEmploye)

module.exports = router
