module.exports = (sequelize, DataTypes) => {
  const bcrypt = require("bcryptjs")
  const jwt = require("jsonwebtoken")

  const Conseiller = sequelize.define(
    "Conseiller",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prenom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telephone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("admin", "conseiller", "gestionnaire"),
        defaultValue: "conseiller",
      },
      statut: {
        type: DataTypes.ENUM("actif", "inactif"),
        defaultValue: "actif",
      },
      derniereConnexion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "conseillers",
      timestamps: true,
      hooks: {
        beforeCreate: async (conseiller) => {
          if (conseiller.password) {
            const salt = await bcrypt.genSalt(10)
            conseiller.password = await bcrypt.hash(conseiller.password, salt)
          }
        },
        beforeUpdate: async (conseiller) => {
          if (conseiller.changed("password")) {
            const salt = await bcrypt.genSalt(10)
            conseiller.password = await bcrypt.hash(conseiller.password, salt)
          }
        },
      },
    },
  )

  // Méthode pour comparer les mots de passe
  Conseiller.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
  }

  // Méthode pour générer un token JWT
  Conseiller.prototype.generateToken = function () {
    return jwt.sign({ id: this.id, email: this.email, role: this.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "24h",
    })
  }

  return Conseiller
}
