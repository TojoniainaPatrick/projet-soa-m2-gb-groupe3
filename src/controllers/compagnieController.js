const { CompagnieAssurance, PoliceAssuranceVie } = require("../models/models")
const { Op } = require("sequelize")

/**
 * @desc    Obtenir toutes les compagnies
 * @route   GET /api/compagnies
 * @access  Private
 */
exports.getCompagnies = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    // Construire les conditions de recherche
    const whereConditions = {}

    if (search) {
      whereConditions[Op.or] = [{ nom: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }]
    }

    // Récupérer les compagnies avec pagination
    const { count, rows: compagnies } = await CompagnieAssurance.findAndCountAll({
      where: whereConditions,
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["nom", "ASC"]],
    })

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: compagnies,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir une compagnie par son ID
 * @route   GET /api/compagnies/:id
 * @access  Private
 */
exports.getCompagnieById = async (req, res, next) => {
  try {
    const compagnie = await CompagnieAssurance.findByPk(req.params.id, {
      include: [PoliceAssuranceVie],
    })

    if (!compagnie) {
      return res.status(404).json({
        success: false,
        message: "Compagnie non trouvée",
      })
    }

    res.status(200).json({
      success: true,
      data: compagnie,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Créer une nouvelle compagnie
 * @route   POST /api/compagnies
 * @access  Private (Admin)
 */
exports.createCompagnie = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.conseiller.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const compagnie = await CompagnieAssurance.create(req.body)

    res.status(201).json({
      success: true,
      message: "Compagnie créée avec succès",
      data: compagnie,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Mettre à jour une compagnie
 * @route   PUT /api/compagnies/:id
 * @access  Private (Admin)
 */
exports.updateCompagnie = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.conseiller.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const compagnie = await CompagnieAssurance.findByPk(req.params.id)

    if (!compagnie) {
      return res.status(404).json({
        success: false,
        message: "Compagnie non trouvée",
      })
    }

    await compagnie.update(req.body)

    res.status(200).json({
      success: true,
      message: "Compagnie mise à jour avec succès",
      data: compagnie,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Supprimer une compagnie
 * @route   DELETE /api/compagnies/:id
 * @access  Private (Admin)
 */
exports.deleteCompagnie = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.conseiller.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      })
    }

    const compagnie = await CompagnieAssurance.findByPk(req.params.id)

    if (!compagnie) {
      return res.status(404).json({
        success: false,
        message: "Compagnie non trouvée",
      })
    }

    // Vérifier si des polices sont liées à cette compagnie
    const polices = await PoliceAssuranceVie.findAll({
      where: { compagnieId: compagnie.id },
    })

    if (polices.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer cette compagnie car des polices y sont associées",
      })
    }

    await compagnie.destroy()

    res.status(200).json({
      success: true,
      message: "Compagnie supprimée avec succès",
    })
  } catch (error) {
    next(error)
  }
}
