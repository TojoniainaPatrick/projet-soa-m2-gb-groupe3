const { validationResult } = require("express-validator")

/**
 * Middleware pour valider les requêtes avec express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Erreur de validation",
      errors: errors.array(),
    })
  }
  next()
}

module.exports = validate
