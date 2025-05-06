const express = require("express")
const router = express.Router()
const notificationController = require("../controllers/notificationController")
const { protect } = require("../middleware/auth")

// Obtenir toutes les notifications
router.get("/", protect, notificationController.getNotifications)

// Obtenir une notification par son ID
router.get("/:id", protect, notificationController.getNotificationById)

// Renvoyer une notification échouée
router.post("/:id/resend", protect, notificationController.resendNotification)

// Supprimer une notification
router.delete("/:id", protect, notificationController.deleteNotification)

module.exports = router
