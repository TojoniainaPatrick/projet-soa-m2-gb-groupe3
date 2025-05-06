const { Beneficiaire, PoliceAssuranceVie, DossierEmploye } = require("../models/models")
const { Op } = require("sequelize")
const notificationService = require("../services/notificationService")

/**
 * @desc    Obtenir tous les bénéficiaires d'une police
 * @route   GET /api/beneficiaires?policeId=:policeId
 * @access  Private
 */
exports.getBeneficiaires = async (req, res, next) => {
  try {
    const { policeId } = req.query

    if (!policeId) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la police est requis",
      })
    }

    // Vérifier si l'utilisateur a accès à la police
    const police = await PoliceAssuranceVie.findByPk(policeId, {
      include: [DossierEmploye],
    })

    if (!police) {
      return res.status(404).json({
        success: false,
        message: "Police non trouvée",
      })
    }

    if (req.conseiller.role !== "admin" && police.DossierEmploye.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette police",
      })
    }

    const beneficiaires = await Beneficiaire.findAll({
      where: { policeId },
      order: [
        ["ordre", "ASC"],
        ["pourcentage", "DESC"],
      ],
    })

    res.status(200).json({
      success: true,
      count: beneficiaires.length,
      data: beneficiaires,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir un bénéficiaire par son ID
 * @route   GET /api/beneficiaires/:id
 * @access  Private
 */
exports.getBeneficiaireById = async (req, res, next) => {
  try {
    const beneficiaire = await Beneficiaire.findByPk(req.params.id, {
      include: [
        {
          model: PoliceAssuranceVie,
          include: [DossierEmploye],
        },
      ],
    })

    if (!beneficiaire) {
      return res.status(404).json({
        success: false,
        message: "Bénéficiaire non trouvé",
      })
    }

    // Vérifier si l'utilisateur a accès au bénéficiaire
    if (req.conseiller.role !== "admin" && beneficiaire.PoliceAssuranceVie.DossierEmploye.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ce bénéficiaire",
      })
    }

    res.status(200).json({
      success: true,
      data: beneficiaire,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Créer un nouveau bénéficiaire
 * @route   POST /api/beneficiaires
 * @access  Private
 */
exports.createBeneficiaire = async (req, res, next) => {
  try {
    const { policeId } = req.body

    if (!policeId) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la police est requis",
      })
    }

    // Vérifier si l'utilisateur a accès à la police
    const police = await PoliceAssuranceVie.findByPk(policeId, {
      include: [DossierEmploye],
    })

    if (!police) {
      return res.status(404).json({
        success: false,
        message: "Police non trouvée",
      })
    }

    if (req.conseiller.role !== "admin" && police.DossierEmploye.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette police",
      })
    }

    // Vérifier que la somme des pourcentages ne dépasse pas 100%
    const beneficiaires = await Beneficiaire.findAll({
      where: { policeId },
    })

    const totalPourcentage = beneficiaires.reduce((sum, b) => sum + Number.parseFloat(b.pourcentage), 0)
    const nouveauPourcentage = Number.parseFloat(req.body.pourcentage)

    if (totalPourcentage + nouveauPourcentage > 100) {
      return res.status(400).json({
        success: false,
        message: "La somme des pourcentages ne peut pas dépasser 100%",
      })
    }

    const beneficiaire = await Beneficiaire.create(req.body)

    // Envoyer une notification pour informer du changement de bénéficiaire
    await notificationService.notifyBeneficiaireChange(police, beneficiaire)

    res.status(201).json({
      success: true,
      message: "Bénéficiaire créé avec succès",
      data: beneficiaire,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Mettre à jour un bénéficiaire
 * @route   PUT /api/beneficiaires/:id
 * @access  Private
 */
exports.updateBeneficiaire = async (req, res, next) => {
  try {
    const beneficiaire = await Beneficiaire.findByPk(req.params.id, {
      include: [
        {
          model: PoliceAssuranceVie,
          include: [DossierEmploye],
        },
      ],
    })

    if (!beneficiaire) {
      return res.status(404).json({
        success: false,
        message: "Bénéficiaire non trouvé",
      })
    }

    // Vérifier si l'utilisateur a accès au bénéficiaire
    if (req.conseiller.role !== "admin" && beneficiaire.PoliceAssuranceVie.DossierEmploye.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ce bénéficiaire",
      })
    }

    // Vérifier que la somme des pourcentages ne dépasse pas 100%
    if (req.body.pourcentage) {
      const beneficiaires = await Beneficiaire.findAll({
        where: {
          policeId: beneficiaire.policeId,
          id: { [Op.ne]: beneficiaire.id },
        },
      })

      const totalPourcentage = beneficiaires.reduce((sum, b) => sum + Number.parseFloat(b.pourcentage), 0)
      const nouveauPourcentage = Number.parseFloat(req.body.pourcentage)

      if (totalPourcentage + nouveauPourcentage > 100) {
        return res.status(400).json({
          success: false,
          message: "La somme des pourcentages ne peut pas dépasser 100%",
        })
      }
    }

    await beneficiaire.update(req.body)

    // Envoyer une notification pour informer de la mise à jour du bénéficiaire
    await notificationService.notifyBeneficiaireChange(beneficiaire.PoliceAssuranceVie, beneficiaire)

    res.status(200).json({
      success: true,
      message: "Bénéficiaire mis à jour avec succès",
      data: beneficiaire,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Supprimer un bénéficiaire
 * @route   DELETE /api/beneficiaires/:id
 * @access  Private
 */
exports.deleteBeneficiaire = async (req, res, next) => {
  try {
    const beneficiaire = await Beneficiaire.findByPk(req.params.id, {
      include: [
        {
          model: PoliceAssuranceVie,
          include: [DossierEmploye],
        },
      ],
    })

    if (!beneficiaire) {
      return res.status(404).json({
        success: false,
        message: "Bénéficiaire non trouvé",
      })
    }

    // Vérifier si l'utilisateur a accès au bénéficiaire
    if (req.conseiller.role !== "admin" && beneficiaire.PoliceAssuranceVie.DossierEmploye.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ce bénéficiaire",
      })
    }

    // Stocker les informations du bénéficiaire avant suppression pour la notification
    const police = beneficiaire.PoliceAssuranceVie
    const beneficiaireInfo = {
      nom: beneficiaire.nom,
      prenom: beneficiaire.prenom,
      pourcentage: beneficiaire.pourcentage,
    }

    await beneficiaire.destroy()

    // Envoyer une notification pour informer de la suppression du bénéficiaire
    await notificationService.notifyBeneficiaireChange(police, {
      ...beneficiaireInfo,
      action: "suppression",
    })

    res.status(200).json({
      success: true,
      message: "Bénéficiaire supprimé avec succès",
    })
  } catch (error) {
    next(error)
  }
}
