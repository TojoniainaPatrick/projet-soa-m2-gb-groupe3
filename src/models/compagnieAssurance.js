module.exports = (sequelize, DataTypes) => {
  const CompagnieAssurance = sequelize.define(
    "CompagnieAssurance",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      telephone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      siteWeb: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
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
      tableName: "compagnies_assurance",
      timestamps: true,
    },
  )

  return CompagnieAssurance
}
