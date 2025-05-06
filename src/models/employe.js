module.exports = (sequelize, DataTypes) => {
  const Employe = sequelize.define(
    "Employe",
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
      telephone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dateNaissance: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      adresse: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      codePostal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ville: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pays: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "France",
      },
      numeroSecuriteSociale: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      dateEmbauche: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      statut: {
        type: DataTypes.ENUM("actif", "inactif", "retraité"),
        defaultValue: "actif",
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
      tableName: "employes",
      timestamps: true,
    },
  )

  return Employe
}
