const express = require("express")
const router = express.Router()
const { check } = require("express-validator")
const authController = require("../controllers/authController")
const { protect } = require("../middleware/auth")
const validate = require("../middleware/validate")

// Route pour l'authentification
router.post(
  "/login",
  [
    check("email", "Veuillez fournir un email valide").isEmail(),
    check("password", "Le mot de passe est requis").exists(),
  ],
  validate,
  authController.login,
)

// Route pour obtenir le profil
router.get("/profile", protect, authController.getProfile)

// Route pour mettre à jour le mot de passe
router.put(
  "/password",
  protect,
  [
    check("currentPassword", "Le mot de passe actuel est requis").exists(),
    check("newPassword", "Le nouveau mot de passe doit contenir au moins 6 caractères").isLength({ min: 6 }),
  ],
  validate,
  authController.updatePassword,
)

module.exports = router
