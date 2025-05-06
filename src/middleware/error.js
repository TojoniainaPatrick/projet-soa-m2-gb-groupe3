/**
 * Middleware de gestion d'erreurs centralisé
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack)

  // Erreur de validation Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Erreur de validation",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    })
  }

  // Erreur unique constraint Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Contrainte d'unicité violée",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    })
  }

  // Erreur de relation Sequelize
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Contrainte de clé étrangère violée",
      error: err.message,
    })
  }

  // Erreur de base de données Sequelize
  if (err.name === "SequelizeDatabaseError") {
    return res.status(500).json({
      success: false,
      message: "Erreur de base de données",
      error: err.message,
    })
  }

  // Erreur 404 personnalisée
  if (err.statusCode === 404) {
    return res.status(404).json({
      success: false,
      message: err.message || "Ressource non trouvée",
    })
  }

  // Erreur 403 personnalisée
  if (err.statusCode === 403) {
    return res.status(403).json({
      success: false,
      message: err.message || "Accès interdit",
    })
  }

  // Erreur 401 personnalisée
  if (err.statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: err.message || "Non autorisé",
    })
  }

  // Erreur par défaut
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Erreur serveur interne",
  })
}

module.exports = errorMiddleware
