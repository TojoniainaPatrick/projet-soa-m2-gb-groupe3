/**
 * Service pour l'envoi de notifications
 */
const { transporter, defaultFrom } = require("../config/email")
const fs = require("fs").promises
const path = require("path")
const handlebars = require("handlebars")
const { Notification } = require("../models/models")
const { Op, Conseiller, DossierEmploye } = require("../models/models") // Import missing models and operators

class NotificationService {
  /**
   * Envoyer un email
   * @param {string} to - Adresse email du destinataire
   * @param {string} subject - Sujet de l'email
   * @param {string} content - Contenu de l'email (HTML ou texte)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<boolean>} - Succès de l'envoi
   */
  async sendEmail(to, subject, content, options = {}) {
    let notification // Declare notification variable
    try {
      // Créer une entrée dans la table Notification
      notification = await Notification.create({
        type: "email",
        destinataire: to,
        sujet: subject,
        contenu: content,
        statut: "en_attente",
        conseillerId: options.conseillerId || null,
        dossierId: options.dossierId || null,
        metadata: options.metadata || null,
      })

      const mailOptions = {
        from: options.from || defaultFrom,
        to,
        subject,
        html: content, // Par défaut, on envoie du HTML
        text: options.text || this.stripHtml(content), // Version texte pour les clients qui ne supportent pas le HTML
        ...options,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log(`Email envoyé: ${info.messageId}`)

      // Mettre à jour le statut de la notification
      await notification.update({
        statut: "envoyé",
        dateEnvoi: new Date(),
        metadata: {
          ...notification.metadata,
          messageId: info.messageId,
          response: info.response,
        },
      })

      return true
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error)

      // Mettre à jour le statut de la notification en cas d'échec
      if (notification) {
        await notification.update({
          statut: "échec",
          erreur: error.message,
          metadata: {
            ...notification.metadata,
            stack: error.stack,
          },
        })
      }

      return false
    }
  }

  /**
   * Envoyer un email avec un template
   * @param {string} to - Adresse email du destinataire
   * @param {string} subject - Sujet de l'email
   * @param {string} templateName - Nom du template (sans extension)
   * @param {Object} data - Données à injecter dans le template
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<boolean>} - Succès de l'envoi
   */
  async sendTemplateEmail(to, subject, templateName, data = {}, options = {}) {
    try {
      // Charger le template
      const templatePath = path.join(__dirname, "../templates", `${templateName}.html`)
      const template = await fs.readFile(templatePath, "utf8")

      // Compiler le template avec Handlebars
      const compiledTemplate = handlebars.compile(template)
      const html = compiledTemplate(data)

      // Enregistrer le template utilisé dans les métadonnées
      const metadata = {
        ...options.metadata,
        template: templateName,
        templateData: data,
      }

      // Envoyer l'email
      return await this.sendEmail(to, subject, html, { ...options, metadata })
    } catch (error) {
      console.error(`Erreur lors de l'envoi de l'email avec le template ${templateName}:`, error)

      // Créer une entrée dans la table Notification pour l'échec
      await Notification.create({
        type: "email",
        destinataire: to,
        sujet: subject,
        contenu: `Échec de l'envoi avec le template ${templateName}`,
        statut: "échec",
        erreur: error.message,
        conseillerId: options.conseillerId || null,
        dossierId: options.dossierId || null,
        metadata: {
          template: templateName,
          templateData: data,
          error: error.stack,
        },
      })

      return false
    }
  }

  /**
   * Notifier un changement de bénéficiaire
   * @param {Object} police - Police d'assurance
   * @param {Object} beneficiaire - Bénéficiaire modifié
   * @returns {Promise<boolean>} - Succès de l'envoi
   */
  async notifyBeneficiaireChange(police, beneficiaire) {
    const subject = `Modification de bénéficiaire - Police ${police.numeroPolice}`
    const templateData = {
      numeroPolice: police.numeroPolice,
      beneficiaire: {
        prenom: beneficiaire.prenom,
        nom: beneficiaire.nom,
        pourcentage: beneficiaire.pourcentage,
        lienParente: beneficiaire.lienParente || "Non spécifié",
      },
      dateModification: new Date().toLocaleString(),
      annee: new Date().getFullYear(),
    }

    const promises = []

    // Notifier la compagnie d'assurance
    if (police.compagnie && police.compagnie.email) {
      promises.push(
        this.sendTemplateEmail(police.compagnie.email, subject, "beneficiaire-change", templateData, {
          metadata: {
            policeId: police.id,
            beneficiaireId: beneficiaire.id,
            type: "notification_compagnie",
          },
        }),
      )
    }

    // Notifier le conseiller
    if (police.dossier && police.dossier.conseiller && police.dossier.conseiller.email) {
      promises.push(
        this.sendTemplateEmail(police.dossier.conseiller.email, subject, "beneficiaire-change", templateData, {
          conseillerId: police.dossier.conseiller.id,
          dossierId: police.dossier.id,
          metadata: {
            policeId: police.id,
            beneficiaireId: beneficiaire.id,
            type: "notification_conseiller",
          },
        }),
      )
    }

    await Promise.all(promises)
    return true
  }

  /**
   * Envoyer un avis de changement à la compagnie d'assurance
   * @param {Object} dossier - Dossier modifié
   * @returns {Promise<boolean>} - Succès de l'envoi
   */
  async envoyerAvisChangement(dossier) {
    if (!dossier.police || !dossier.police.compagnie) {
      return false
    }

    const subject = `Avis de changement - Dossier ${dossier.reference}`
    const templateData = {
      reference: dossier.reference,
      employe: dossier.employe
        ? {
            prenom: dossier.employe.prenom,
            nom: dossier.employe.nom,
          }
        : { prenom: "", nom: "Non spécifié" },
      police: {
        numeroPolice: dossier.police.numeroPolice,
      },
      statutChange: dossier.statutChange || false,
      ancienStatut: dossier.ancienStatut,
      nouveauStatut: dossier.statut,
      dateModification: new Date().toLocaleString(),
      annee: new Date().getFullYear(),
    }

    if (dossier.police.compagnie.email) {
      return await this.sendTemplateEmail(dossier.police.compagnie.email, subject, "dossier-change", templateData, {
        dossierId: dossier.id,
        metadata: {
          policeId: dossier.police.id,
          compagnieId: dossier.police.compagnie.id,
          type: "avis_changement",
        },
      })
    }

    return false
  }

  /**
   * Récupérer l'historique des notifications
   * @param {Object} filters - Filtres de recherche
   * @param {number} page - Numéro de page
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} - Résultat paginé
   */
  async getNotificationsHistory(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit
    const whereConditions = {}

    if (filters.type) {
      whereConditions.type = filters.type
    }

    if (filters.statut) {
      whereConditions.statut = filters.statut
    }

    if (filters.conseillerId) {
      whereConditions.conseillerId = filters.conseillerId
    }

    if (filters.dossierId) {
      whereConditions.dossierId = filters.dossierId
    }

    if (filters.dateDebut && filters.dateFin) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(filters.dateDebut), new Date(filters.dateFin)],
      }
    } else if (filters.dateDebut) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(filters.dateDebut),
      }
    } else if (filters.dateFin) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(filters.dateFin),
      }
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereConditions,
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["createdAt", "DESC"]],
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

    return {
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      data: rows,
    }
  }

  /**
   * Convertir le HTML en texte brut
   * @param {string} html - Contenu HTML
   * @returns {string} - Texte brut
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, "") // Supprimer les balises HTML
      .replace(/\s+/g, " ") // Remplacer les espaces multiples par un seul espace
      .trim()
  }
}

module.exports = new NotificationService()
