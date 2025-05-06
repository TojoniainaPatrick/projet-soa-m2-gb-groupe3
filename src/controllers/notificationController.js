const { Notification, Conseiller, DossierEmploye } = require("../models/models")
const { Op } = require("sequelize")
const notificationService = require("../services/notificationService")

/**
 * @desc    Obtenir l'historique des notifications
 * @route   GET /api/notifications
 * @access  Private (Admin)
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { type, statut, conseillerId, dossierId, dateDebut, dateFin, page = 1, limit = 10 } = req.query

    // Vérifier si l'utilisateur est admin ou s'il demande ses propres notifications
    if (req.conseiller.role !== "admin" && (!conseillerId || Number.parseInt(conseillerId) !== req.conseiller.id)) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const filters = {
      type,
      statut,
      conseillerId: conseillerId || (req.conseiller.role !== "admin" ? req.conseiller.id : undefined),
      dossierId,
      dateDebut,
      dateFin,
    }

    const result = await notificationService.getNotificationsHistory(filters, page, limit)

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir une notification par son ID
 * @route   GET /api/notifications/:id
 * @access  Private (Admin ou le conseiller concerné)
 */
exports.getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id, {
      include: [
        {
          model: Conseiller,
          attributes: ["id", "nom", "prenom", "email"],
        },
        {
          model: DossierEmploye,
          attributes: ["id", "reference", "statut"],
        },
      ],
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée",
      })
    }

    // Vérifier si l'utilisateur est admin ou le conseiller concerné
    if (req.conseiller.role !== "admin" && notification.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    res.status(200).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Renvoyer une notification échouée
 * @route   POST /api/notifications/:id/resend
 * @access  Private (Admin)
 */
exports.resendNotification = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.conseiller.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const notification = await Notification.findByPk(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée",
      })
    }

    if (notification.statut !== "échec") {
      return res.status(400).json({
        success: false,
        message: "Seules les notifications en échec peuvent être renvoyées",
      })
    }

    let success = false

    if (notification.type === "email") {
      success = await notificationService.sendEmail(
        notification.destinataire,
        notification.sujet,
        notification.contenu,
        {
          conseillerId: notification.conseillerId,
          dossierId: notification.dossierId,
          metadata: {
            ...notification.metadata,
            resent: true,
            originalId: notification.id,
          },
        },
      )
    }

    if (success) {
      res.status(200).json({
        success: true,
        message: "Notification renvoyée avec succès",
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Échec du renvoi de la notification",
      })
    }
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Supprimer une notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Admin)
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.conseiller.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const notification = await Notification.findByPk(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée",
      })
    }

    await notification.destroy()

    res.status(200).json({
      success: true,
      message: "Notification supprimée avec succès",
    })
  } catch (error) {
    next(error)
  }
}
