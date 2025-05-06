const {
  DossierEmploye,
  Employe,
  Conseiller,
  PoliceAssuranceVie,
  Beneficiaire,
  CompagnieAssurance,
} = require("../models/models")
const { Op } = require("sequelize")
const notificationService = require("../services/notificationService")
const { executeInTransaction } = require("../services/transactionService")

/**
 * @desc    Obtenir tous les dossiers
 * @route   GET /api/dossiers
 * @access  Private
 */
exports.getDossiers = async (req, res, next) => {
  try {
    const { search, statut, conseillerId, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    // Construire les conditions de recherche
    const whereConditions = {}

    if (search) {
      whereConditions[Op.or] = [{ reference: { [Op.iLike]: `%${search}%` } }, { notes: { [Op.iLike]: `%${search}%` } }]
    }

    if (statut) {
      whereConditions.statut = statut
    }

    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres dossiers
    if (req.conseiller.role !== "admin") {
      whereConditions.conseillerId = req.conseiller.id
    } else if (conseillerId) {
      whereConditions.conseillerId = conseillerId
    }

    // Récupérer les dossiers avec pagination
    const { count, rows: dossiers } = await DossierEmploye.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Employe,
        },
        {
          model: Conseiller,
          attributes: ["id", "nom", "prenom", "email"],
        },
      ],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["dateCreation", "DESC"]],
    })

    // Pour chaque dossier, récupérer les polices associées depuis la base assurances
    const dossiersComplets = await Promise.all(
      dossiers.map(async (dossier) => {
        const dossierJSON = dossier.toJSON()
        const polices = await PoliceAssuranceVie.findAll({
          where: { dossierId: dossier.id },
        })
        dossierJSON.polices = polices
        return dossierJSON
      }),
    )

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: dossiersComplets,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtenir un dossier par son ID
 * @route   GET /api/dossiers/:id
 * @access  Private
 */
exports.getDossierById = async (req, res, next) => {
  try {
    const dossier = await DossierEmploye.findByPk(req.params.id, {
      include: [
        {
          model: Employe,
        },
        {
          model: Conseiller,
          attributes: ["id", "nom", "prenom", "email"],
        },
      ],
    })

    if (!dossier) {
      return res.status(404).json({
        success: false,
        message: "Dossier non trouvé",
      })
    }

    // Vérifier si l'utilisateur a accès au dossier
    if (req.conseiller.role !== "admin" && dossier.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ce dossier",
      })
    }

    // Récupérer les polices associées depuis la base assurances
    const polices = await PoliceAssuranceVie.findAll({
      where: { dossierId: dossier.id },
      include: [
        {
          model: Beneficiaire,
        },
        {
          model: CompagnieAssurance,
        },
      ],
    })

    // Ajouter les polices au dossier
    const dossierComplet = dossier.toJSON()
    dossierComplet.polices = polices

    res.status(200).json({
      success: true,
      data: dossierComplet,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Créer un nouveau dossier
 * @route   POST /api/dossiers
 * @access  Private
 */
exports.createDossier = async (req, res, next) => {
  try {
    // Si l'utilisateur n'est pas admin, il ne peut créer que des dossiers pour lui-même
    if (req.conseiller.role !== "admin") {
      req.body.conseillerId = req.conseiller.id
    }

    // Générer une référence unique si non fournie
    if (!req.body.reference) {
      const date = new Date()
      const year = date.getFullYear().toString().substr(-2)
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")
      req.body.reference = `DOS-${year}${month}-${random}`
    }

    const dossier = await DossierEmploye.create(req.body)

    // Charger les informations complètes du dossier pour la notification
    const dossierComplet = await DossierEmploye.findByPk(dossier.id, { include: [Employe, Conseiller] })

    // Préparer les données pour le template d'email
    const emailData = {
      reference: dossier.reference,
      employe: dossierComplet.Employe
        ? {
            prenom: dossierComplet.Employe.prenom,
            nom: dossierComplet.Employe.nom,
          }
        : { prenom: "", nom: "Non spécifié" },
      conseiller: dossierComplet.Conseiller
        ? {
            prenom: dossierComplet.Conseiller.prenom,
            nom: dossierComplet.Conseiller.nom,
          }
        : { prenom: "", nom: "Non spécifié" },
      statut: dossier.statut,
      dateCreation: new Date(dossier.dateCreation).toLocaleString(),
      urlDossier: `${process.env.APP_URL}/dossiers/${dossier.id}`,
      annee: new Date().getFullYear(),
    }

    // Notifier le Conseiller si ce n'est pas lui qui a créé le dossier
    if (
      dossierComplet.Conseiller &&
      dossierComplet.Conseiller.email &&
      dossierComplet.Conseiller.id !== req.conseiller.id
    ) {
      await notificationService.sendTemplateEmail(
        dossierComplet.Conseiller.email,
        `Nouveau dossier créé - ${dossier.reference}`,
        "new-dossier",
        emailData,
        {
          conseillerId: dossierComplet.Conseiller.id,
          dossierId: dossier.id,
        },
      )
    }

    res.status(201).json({
      success: true,
      message: "Dossier créé avec succès",
      data: dossier,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Mettre à jour un dossier
 * @route   PUT /api/dossiers/:id
 * @access  Private
 */
exports.updateDossier = async (req, res, next) => {
  try {
    const dossier = await DossierEmploye.findByPk(req.params.id, {
      include: [Employe, Conseiller],
    })

    if (!dossier) {
      return res.status(404).json({
        success: false,
        message: "Dossier non trouvé",
      })
    }

    // Vérifier si l'utilisateur a accès au dossier
    if (req.conseiller.role !== "admin" && dossier.conseillerId !== req.conseiller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ce dossier",
      })
    }

    // Si l'utilisateur n'est pas admin, il ne peut pas changer le conseiller
    if (req.conseiller.role !== "admin") {
      delete req.body.conseillerId
    }

    // Stocker l'ancien statut pour vérifier s'il a changé
    const ancienStatut = dossier.statut

    await dossier.update(req.body)

    // Récupérer les polices associées depuis la base assurances
    const polices = await PoliceAssuranceVie.findAll({
      where: { dossierId: dossier.id },
      include: [CompagnieAssurance],
    })

    // Si le statut a changé, envoyer une notification
    if (req.body.statut && req.body.statut !== ancienStatut) {
      // Préparer les données pour le template d'email
      const emailData = {
        reference: dossier.reference,
        employe: dossier.Employe
          ? {
              prenom: dossier.Employe.prenom,
              nom: dossier.Employe.nom,
            }
          : { prenom: "", nom: "Non spécifié" },
        police:
          polices.length > 0
            ? {
                numeroPolice: polices[0].numeroPolice,
              }
            : { numeroPolice: "Non spécifié" },
        statutChange: true,
        ancienStatut: ancienStatut,
        nouveauStatut: dossier.statut,
        dateModification: new Date().toLocaleString(),
        annee: new Date().getFullYear(),
      }

      // Notifier le conseiller si ce n'est pas lui qui a modifié le dossier
      if (dossier.Conseiller && dossier.Conseiller.email && dossier.Conseiller.id !== req.conseiller.id) {
        await notificationService.sendTemplateEmail(
          dossier.Conseiller.email,
          `Changement de statut de dossier - ${dossier.reference}`,
          "dossier-change",
          emailData,
          {
            conseillerId: dossier.Conseiller.id,
            dossierId: dossier.id,
          },
        )
      }

      // Notifier la compagnie d'assurance si le dossier a une police
      for (const police of polices) {
        if (police.CompagnieAssurance && police.CompagnieAssurance.email) {
          await notificationService.sendTemplateEmail(
            police.CompagnieAssurance.email,
            `Changement de statut de dossier - ${dossier.reference}`,
            "dossier-change",
            emailData,
            {
              dossierId: dossier.id,
              metadata: {
                policeId: police.id,
                compagnieId: police.CompagnieAssurance.id,
              },
            },
          )
        }
      }
    }

    // Ajouter les polices au dossier pour la réponse
    const dossierComplet = dossier.toJSON()
    dossierComplet.polices = polices

    res.status(200).json({
      success: true,
      message: "Dossier mis à jour avec succès",
      data: dossierComplet,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Supprimer un dossier
 * @route   DELETE /api/dossiers/:id
 * @access  Private
 */
exports.deleteDossier = async (req, res, next) => {
  try {
    // Utiliser le service de transaction pour supprimer le dossier et ses polices associées
    await executeInTransaction(async (clientsTransaction, assurancesTransaction) => {
      const dossier = await DossierEmploye.findByPk(req.params.id, {
        include: [Employe, Conseiller],
        transaction: clientsTransaction,
      })

      if (!dossier) {
        throw { statusCode: 404, message: "Dossier non trouvé" }
      }

      // Vérifier si l'utilisateur a accès au dossier
      if (req.conseiller.role !== "admin" && dossier.conseillerId !== req.conseiller.id) {
        throw { statusCode: 403, message: "Accès non autorisé à ce dossier" }
      }

      // Récupérer les polices associées
      const polices = await PoliceAssuranceVie.findAll({
        where: { dossierId: dossier.id },
        include: [CompagnieAssurance],
        transaction: assurancesTransaction,
      })

      // Stocker les informations du dossier et des polices avant suppression pour les notifications
      const dossierInfo = {
        id: dossier.id,
        reference: dossier.reference,
        employe: dossier.Employe,
        conseiller: dossier.Conseiller,
        polices: polices,
      }

      // Supprimer les bénéficiaires associés aux polices
      for (const police of polices) {
        await Beneficiaire.destroy({
          where: { policeId: police.id },
          transaction: assurancesTransaction,
        })
      }

      // Supprimer les polices
      await PoliceAssuranceVie.destroy({
        where: { dossierId: dossier.id },
        transaction: assurancesTransaction,
      })

      // Supprimer le dossier
      await dossier.destroy({ transaction: clientsTransaction })

      // Envoyer des notifications après la transaction
      setTimeout(async () => {
        // Notifier le conseiller si ce n'est pas lui qui a supprimé le dossier
        if (dossierInfo.conseiller && dossierInfo.conseiller.email && dossierInfo.conseiller.id !== req.conseiller.id) {
          await notificationService.sendEmail(
            dossierInfo.conseiller.email,
            `Suppression de dossier - ${dossierInfo.reference}`,
            `
            <h2>Suppression de dossier</h2>
            <p>Le dossier <strong>${dossierInfo.reference}</strong> a été supprimé:</p>
            <ul>
              <li><strong>Employé:</strong> ${dossierInfo.employe ? `${dossierInfo.employe.prenom} ${dossierInfo.employe.nom}` : "Non spécifié"}</li>
              <li><strong>Date de suppression:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            `,
            {
              conseillerId: dossierInfo.conseiller.id,
            },
          )
        }

        // Notifier les compagnies d'assurance pour chaque police
        for (const police of dossierInfo.polices) {
          if (police.CompagnieAssurance && police.CompagnieAssurance.email) {
            await notificationService.sendEmail(
              police.CompagnieAssurance.email,
              `Suppression de police - ${police.numeroPolice}`,
              `
              <h2>Suppression de police</h2>
              <p>La police <strong>${police.numeroPolice}</strong> a été supprimée suite à la suppression du dossier ${dossierInfo.reference}.</p>
              <p>Date de suppression: ${new Date().toLocaleString()}</p>
              `,
              {
                metadata: {
                  dossierReference: dossierInfo.reference,
                  policeNumero: police.numeroPolice,
                  compagnieId: police.CompagnieAssurance.id,
                },
              },
            )
          }
        }
      }, 0)

      return { success: true }
    })

    res.status(200).json({
      success: true,
      message: "Dossier supprimé avec succès",
    })
  } catch (error) {
    next(error)
  }
}
