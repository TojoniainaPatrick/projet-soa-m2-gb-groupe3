const {
  PoliceAssuranceVie,
  DossierEmploye,
  CompagnieAssurance,
  Beneficiaire,
  Employe,
  Conseiller,
} = require("../models/models")
const { Op } = require("sequelize")
const notificationService = require("../services/notificationService")
const { executeInTransaction } = require("../services/transactionService")

/**
 * @desc    Obtenir toutes les polices
 * @route   GET /api/polices
 * @access  Private
 */
exports.getPolices = async (req, res, next) => {
  try {
    const { search, statut, compagnieId, dossierId, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    // Construire les conditions de recherche
    const whereConditions = {}

    if (search) {
      whereConditions[Op.or] = [{ numeroPolice: { [Op.iLike]: `%${search}%` } }]
    }

    if (statut) {
      whereConditions.statut = statut
    }

    if (compagnieId) {
      whereConditions.compagnieId = compagnieId
    }

    if (dossierId) {
      whereConditions.dossierId = dossierId
    }

    // Si l'utilisateur n'est pas admin, il ne peut voir que les polices de ses dossiers
    if (req.conseiller.role !== "admin") {
      const dossiers = await DossierEmploye.findAll({
        where: { conseillerId: req.conseiller.id },
        attributes: ["id"],
      })

      const dossierIds = dossiers.map((d) => d.id)
      whereConditions.dossierId = { [Op.in]: dossierIds }
    }

    // Récupérer les polices avec pagination
    const { count, rows: polices } = await PoliceAssuranceVie.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: CompagnieAssurance,
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["dateEffet", "DESC"]],
    })

    // Récupérer les dossiers associés
    const policesAvecDossiers = await Promise.all(
      polices.map(async (police) => {
        const policeJSON = police.toJSON()
        const dossier = await DossierEmploye.findByPk(police.dossierId, {
          include: [Employe],
        })
        policeJSON.dossier = dossier
        return policeJSON
      }),
    )

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: policesAvecDossiers,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir une police par son ID
 * @route   GET /api/polices/:id
 * @access  Private
 */
exports.getPoliceById = async (req, res, next) => {
  try {
    const police = await PoliceAssuranceVie.findByPk(req.params.id, {
      include: [
        {
          model: CompagnieAssurance,
        },
        {
          model: Beneficiaire,
        },
      ],
    })

    if (!police) {
      return res.status(404).json({
        success: false,
        message: "Police non trouvée",
      })
    }

    // Récupérer le dossier associé
    const dossier = await DossierEmploye.findByPk(police.dossierId, {
      include: [Employe, Conseiller],
    })

    if (!dossier) {
      return res.status(404).json({
        success: false,
        message: "Dossier associé non trouvé",
      })
    }

    // Vérifier si l'utilisateur a accès à la police
    if (req.conseiller.role !== "admin" && dossier.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette police",
      })
    }

    // Ajouter le dossier à la police
    const policeComplete = police.toJSON()
    policeComplete.dossier = dossier

    res.status(200).json({
      success: true,
      data: policeComplete,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Créer une nouvelle police
 * @route   POST /api/polices
 * @access  Private
 */
exports.createPolice = async (req, res, next) => {
  try {
    const { dossierId } = req.body

    if (!dossierId) {
      return res.status(400).json({
        success: false,
        message: "L'ID du dossier est requis",
      })
    }

    // Utiliser le service de transaction
    const result = await executeInTransaction(async (clientsTransaction, assurancesTransaction) => {
      // Vérifier si l'utilisateur a accès au dossier
      const dossier = await DossierEmploye.findByPk(dossierId, {
        include: [Employe],
        transaction: clientsTransaction,
      })

      if (!dossier) {
        throw { statusCode: 404, message: "Dossier non trouvé" }
      }

      if (req.conseiller.role !== "admin" && dossier.conseillerId !== req.conseiller.id) {
        throw { statusCode: 403, message: "Accès non autorisé à ce dossier" }
      }

      // Vérifier si une police existe déjà pour ce dossier
      const policeExistante = await PoliceAssuranceVie.findOne({
        where: { dossierId },
        transaction: assurancesTransaction,
      })

      if (policeExistante) {
        throw { statusCode: 400, message: "Une police existe déjà pour ce dossier" }
      }

      // Créer la police
      const police = await PoliceAssuranceVie.create(req.body, {
        transaction: assurancesTransaction,
      })

      // Mettre à jour le statut du dossier
      await dossier.update({ statut: "complet" }, { transaction: clientsTransaction })

      return { police, dossier }
    })

    // Charger les informations complètes de la police pour la notification
    const policeComplete = await PoliceAssuranceVie.findByPk(result.police.id, {
      include: [
        CompagnieAssurance,
        {
          model: Beneficiaire,
        },
      ],
    })

    // Envoyer une notification pour informer de la création de la police
    const subject = `Nouvelle police d'assurance - ${result.police.numeroPolice}`
    const content = `
      <h2>Nouvelle police d'assurance</h2>
      <p>Une nouvelle police d'assurance a été créée:</p>
      <ul>
        <li><strong>Numéro de police:</strong> ${result.police.numeroPolice}</li>
        <li><strong>Employé:</strong> ${result.dossier.employe ? `${result.dossier.employe.prenom} ${result.dossier.Employe.nom}` : "Non spécifié"}</li>
        <li><strong>Capital assuré:</strong> ${result.police.capitalAssure}</li>
        <li><strong>Prime mensuelle:</strong> ${result.police.primeMensuelle}</li>
        <li><strong>Date d'effet:</strong> ${result.police.dateEffet}</li>
        <li><strong>Type de contrat:</strong> ${result.police.typeContrat}</li>
      </ul>
      <p>Veuillez consulter votre espace partenaire pour plus de détails.</p>
    `

    // Notifier la compagnie d'assurance si l'email est disponible
    if (policeComplete.CompagnieAssurance && policeComplete.CompagnieAssurance.email) {
      await notificationService.sendEmail(policeComplete.CompagnieAssurance.email, subject, content, {
        metadata: {
          policeId: result.police.id,
          compagnieId: policeComplete.CompagnieAssurance.id,
          dossierId: result.dossier.id,
        },
      })
    }

    res.status(201).json({
      success: true,
      message: "Police créée avec succès",
      data: result.police,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Mettre à jour une police
 * @route   PUT /api/polices/:id
 * @access  Private
 */
exports.updatePolice = async (req, res, next) => {
  try {
    const police = await PoliceAssuranceVie.findByPk(req.params.id, {
      include: [CompagnieAssurance],
    })

    if (!police) {
      return res.status(404).json({
        success: false,
        message: "Police non trouvée",
      })
    }

    // Récupérer le dossier associé
    const dossier = await DossierEmploye.findByPk(police.dossierId, {
      include: [Employe],
    })

    if (!dossier) {
      return res.status(404).json({
        success: false,
        message: "Dossier associé non trouvé",
      })
    }

    // Vérifier si l'utilisateur a accès à la police
    if (req.conseiller.role !== "admin" && dossier.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette police",
      })
    }

    // Empêcher la modification du dossier
    delete req.body.dossierId

    // Stocker l'ancien statut pour vérifier s'il a changé
    const ancienStatut = police.statut

    await police.update(req.body)

    // Si le statut a changé, envoyer une notification
    if (req.body.statut && req.body.statut !== ancienStatut) {
      const subject = `Changement de statut de police - ${police.numeroPolice}`
      const content = `
        <h2>Changement de statut de police</h2>
        <p>Le statut de la police ${police.numeroPolice} a été modifié:</p>
        <ul>
          <li><strong>Ancien statut:</strong> ${ancienStatut}</li>
          <li><strong>Nouveau statut:</strong> ${police.statut}</li>
          <li><strong>Employé:</strong> ${dossier.Employe ? `${dossier.Employe.prenom} ${dossier.Employe.nom}` : "Non spécifié"}</li>
          <li><strong>Date de modification:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Veuillez consulter votre espace partenaire pour plus de détails.</p>
      `

      // Notifier la compagnie d'assurance si l'email est disponible
      if (police.CompagnieAssurance && police.CompagnieAssurance.email) {
        await notificationService.sendEmail(police.CompagnieAssurance.email, subject, content, {
          metadata: {
            policeId: police.id,
            compagnieId: police.CompagnieAssurance.id,
            dossierId: dossier.id,
            changementStatut: {
              ancien: ancienStatut,
              nouveau: police.statut,
            },
          },
        })
      }
    }

    res.status(200).json({
      success: true,
      message: "Police mise à jour avec succès",
      data: police,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Supprimer une police
 * @route   DELETE /api/polices/:id
 * @access  Private
 */
exports.deletePolice = async (req, res, next) => {
  try {
    // Utiliser le service de transaction
    await executeInTransaction(async (clientsTransaction, assurancesTransaction) => {
      const police = await PoliceAssuranceVie.findByPk(req.params.id, {
        include: [
          {
            model: CompagnieAssurance,
          },
        ],
        transaction: assurancesTransaction,
      })

      if (!police) {
        throw { statusCode: 404, message: "Police non trouvée" }
      }

      // Récupérer le dossier associé
      const dossier = await DossierEmploye.findByPk(police.dossierId, {
        include: [Employe],
        transaction: clientsTransaction,
      })

      if (!dossier) {
        throw { statusCode: 404, message: "Dossier associé non trouvé" }
      }

      // Vérifier si l'utilisateur a accès à la police
      if (req.conseiller.role !== "admin" && dossier.conseillerId !== req.conseiller.id) {
        throw { statusCode: 403, message: "Accès non autorisé à cette police" }
      }

      // Stocker les informations de la police avant suppression pour la notification
      const policeInfo = {
        id: police.id,
        numeroPolice: police.numeroPolice,
        compagnie: police.CompagnieAssurance,
        dossier: dossier,
      }

      // Supprimer les bénéficiaires associés
      await Beneficiaire.destroy({
        where: { policeId: police.id },
        transaction: assurancesTransaction,
      })

      // Supprimer la police
      await police.destroy({ transaction: assurancesTransaction })

      // Mettre à jour le statut du dossier si nécessaire
      if (dossier.statut === "complet") {
        await dossier.update({ statut: "incomplet" }, { transaction: clientsTransaction })
      }

      // Envoyer une notification après la transaction
      setTimeout(async () => {
        // Envoyer une notification pour informer de la suppression de la police
        const subject = `Suppression de police - ${policeInfo.numeroPolice}`
        const content = `
          <h2>Suppression de police</h2>
          <p>La police ${policeInfo.numeroPolice} a été supprimée:</p>
          <ul>
            <li><strong>Employé:</strong> ${policeInfo.dossier.Employe ? `${policeInfo.dossier.Employe.prenom} ${policeInfo.dossier.Employe.nom}` : "Non spécifié"}</li>
            <li><strong>Date de suppression:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        `

        // Notifier la compagnie d'assurance si l'email est disponible
        if (policeInfo.compagnie && policeInfo.compagnie.email) {
          await notificationService.sendEmail(policeInfo.compagnie.email, subject, content, {
            metadata: {
              policeId: policeInfo.id,
              compagnieId: policeInfo.compagnie.id,
              dossierId: policeInfo.dossier.id,
            },
          })
        }
      }, 0)

      return { success: true }
    })

    res.status(200).json({
      success: true,
      message: "Police supprimée avec succès",
    })
  } catch (error) {
    next(error)
  }
}
