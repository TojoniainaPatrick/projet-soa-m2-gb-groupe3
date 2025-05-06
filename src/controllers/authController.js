const { Conseiller } = require("../models/models")
const { validationResult } = require("express-validator")

/**
 * @desc    Authentifier un conseiller
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Vérifier si l'email et le mot de passe sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir un email et un mot de passe",
      })
    }

    // Vérifier si le conseiller existe
    const conseiller = await Conseiller.findOne({ where: { email } })
    if (!conseiller) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides",
      })
    }

    // Vérifier si le conseiller est actif
    if (conseiller.statut !== "actif") {
      return res.status(401).json({
        success: false,
        message: "Compte désactivé, veuillez contacter l'administrateur",
      })
    }

    // Vérifier si le mot de passe est correct
    const isMatch = await conseiller.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides",
      })
    }

    // Mettre à jour la dernière connexion
    conseiller.derniereConnexion = new Date()
    await conseiller.save()

    // Générer un token JWT
    const token = conseiller.generateToken()

    res.status(200).json({
      success: true,
      message: "Authentification réussie",
      data: {
        token,
        conseiller: {
          id: conseiller.id,
          nom: conseiller.nom,
          prenom: conseiller.prenom,
          email: conseiller.email,
          role: conseiller.role,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir le profil du conseiller connecté
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const conseiller = await Conseiller.findByPk(req.conseiller.id, {
      attributes: { exclude: ["password"] },
    })

    if (!conseiller) {
      return res.status(404).json({
        success: false,
        message: "Conseiller non trouvé",
      })
    }

    res.status(200).json({
      success: true,
      data: conseiller,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Mettre à jour le mot de passe
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Vérifier si les mots de passe sont fournis
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir le mot de passe actuel et le nouveau mot de passe",
      })
    }

    // Récupérer le conseiller
    const conseiller = await Conseiller.findByPk(req.conseiller.id)

    // Vérifier si le mot de passe actuel est correct
    const isMatch = await conseiller.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect",
      })
    }

    // Mettre à jour le mot de passe
    conseiller.password = newPassword
    await conseiller.save()

    res.status(200).json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    })
  } catch (error) {
    next(error)
  }
}
