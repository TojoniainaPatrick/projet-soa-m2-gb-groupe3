const { Employe, DossierEmploye } = require("../models/models")
const { Op } = require("sequelize")

/**
 * @desc    Obtenir tous les employés
 * @route   GET /api/employes
 * @access  Private
 */
exports.getEmployes = async (req, res, next) => {
  try {
    const { search, statut, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    // Construire les conditions de recherche
    const whereConditions = {}

    if (search) {
      whereConditions[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { numeroSecuriteSociale: { [Op.iLike]: `%${search}%` } },
      ]
    }

    if (statut) {
      whereConditions.statut = statut
    }

    // Récupérer les employés avec pagination
    const { count, rows: employes } = await Employe.findAndCountAll({
      where: whereConditions,
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
      data: employes,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir un employé par son ID
 * @route   GET /api/employes/:id
 * @access  Private
 */
exports.getEmployeById = async (req, res, next) => {
  try {
    const employe = await Employe.findByPk(req.params.id, {
      include: [DossierEmploye],
    })

    if (!employe) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      })
    }

    res.status(200).json({
      success: true,
      data: employe,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Créer un nouvel employé
 * @route   POST /api/employes
 * @access  Private
 */
exports.createEmploye = async (req, res, next) => {
  try {
    const employe = await Employe.create(req.body)

    res.status(201).json({
      success: true,
      message: "Employé créé avec succès",
      data: employe,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Mettre à jour un employé
 * @route   PUT /api/employes/:id
 * @access  Private
 */
exports.updateEmploye = async (req, res, next) => {
  try {
    const employe = await Employe.findByPk(req.params.id)

    if (!employe) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      })
    }

    await employe.update(req.body)

    res.status(200).json({
      success: true,
      message: "Employé mis à jour avec succès",
      data: employe,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Supprimer un employé
 * @route   DELETE /api/employes/:id
 * @access  Private
 */
exports.deleteEmploye = async (req, res, next) => {
  try {
    const employe = await Employe.findByPk(req.params.id)

    if (!employe) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      })
    }

    await employe.destroy()

    res.status(200).json({
      success: true,
      message: "Employé supprimé avec succès",
    })
  } catch (error) {
    next(error)
  }
}
