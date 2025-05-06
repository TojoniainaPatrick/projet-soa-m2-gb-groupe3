const { Conseiller, DossierEmploye } = require("../models/models")
const { Op } = require("sequelize")

/**
 * @desc    Obtenir tous les conseillers
 * @route   GET /api/conseillers
 * @access  Private (Admin)
 */
exports.getConseillers = async (req, res, next) => {
  try {
    const { search, role, statut, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    // Vérifier si l'utilisateur est admin
    if (req.conseiller.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    // Construire les conditions de recherche
    const whereConditions = {}

    if (search) {
      whereConditions[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ]
    }

    if (role) {
      whereConditions.role = role
    }

    if (statut) {
      whereConditions.statut = statut
    }

    // Récupérer les conseillers avec pagination
    const { count, rows: conseillers } = await Conseiller.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ["password"] },
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [
        ["nom", "ASC"],
        ["prenom", "ASC"],
      ],
    })

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: conseillers,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir un conseiller par son ID
 * @route   GET /api/conseillers/:id
 * @access  Private (Admin ou le conseiller lui-même)
 */
exports.getConseillerById = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin ou le conseiller lui-même
    if (req.conseiller.role !== "admin" && req.conseiller.id !== Number.parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const conseiller = await Conseiller.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [ DossierEmploye ]
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
 * @desc    Créer un nouveau conseiller
 * @route   POST /api/conseillers
 * @access  Private (Admin)
 */
exports.createConseiller = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin
    // if (req.conseiller.role !== "admin") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Accès non autorisé",
    //   })
    // }

    const conseiller = await Conseiller.create(req.body)

    // Exclure le mot de passe de la réponse
    const conseillerResponse = conseiller.toJSON()
    delete conseillerResponse.password

    res.status(201).json({
      success: true,
      message: "Conseiller créé avec succès",
      data: conseillerResponse,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Mettre à jour un conseiller
 * @route   PUT /api/conseillers/:id
 * @access  Private (Admin ou le conseiller lui-même)
 */
exports.updateConseiller = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin ou le conseiller lui-même
    if (req.conseiller.role !== "admin" && req.conseiller.id !== Number.parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const conseiller = await Conseiller.findByPk(req.params.id)

    if (!conseiller) {
      return res.status(404).json({
        success: false,
        message: "Conseiller non trouvé",
      })
    }

    // Si l'utilisateur n'est pas admin, il ne peut pas modifier le rôle ou le statut
    if (req.conseiller.role !== "admin") {
      delete req.body.role
      delete req.body.statut
    }

    await conseiller.update(req.body)

    // Exclure le mot de passe de la réponse
    const conseillerResponse = conseiller.toJSON()
    delete conseillerResponse.password

    res.status(200).json({
      success: true,
      message: "Conseiller mis à jour avec succès",
      data: conseillerResponse,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Supprimer un conseiller
 * @route   DELETE /api/conseillers/:id
 * @access  Private (Admin)
 */
exports.deleteConseiller = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.conseiller.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const conseiller = await Conseiller.findByPk(req.params.id)

    if (!conseiller) {
      return res.status(404).json({
        success: false,
        message: "Conseiller non trouvé",
      })
    }

    await conseiller.destroy()

    res.status(200).json({
      success: true,
      message: "Conseiller supprimé avec succès",
    })
  } catch (error) {
    next(error)
  }
}
