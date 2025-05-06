const jwt = require("jsonwebtoken")
const { Conseiller } = require("../models/models")

/**
 * Middleware pour protéger les routes nécessitant une authentification
 */
exports.protect = async (req, res, next) => {
  try {
    let token

    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Accès non autorisé, veuillez vous connecter",
      })
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      console.log(decoded)

      // Récupérer le conseiller correspondant
      const conseiller = await Conseiller.findByPk(decoded.id)

      console.log("conseiller", conseiller)

      if (!conseiller) {
        return res.status(401).json({
          success: false,
          message: "Conseiller non trouvé",
        })
      }

      // Ajouter le conseiller à l'objet request
      req.conseiller = conseiller
      next()
    } catch (error) {
      console.log(error)
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      })
    }
  } catch (error) {
    next(error)
  }
}
