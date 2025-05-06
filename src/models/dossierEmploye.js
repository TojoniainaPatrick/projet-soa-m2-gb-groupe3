module.exports = (sequelize, DataTypes) => {
  const DossierEmploye = sequelize.define(
    "DossierEmploye",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "employes",
          key: "id",
        },
      },
      conseillerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "conseillers",
          key: "id",
        },
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      statut: {
        type: DataTypes.ENUM("en_cours", "complet", "incomplet", "archivé"),
        defaultValue: "en_cours",
      },
      dateCreation: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      dateMiseAJour: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
      tableName: "dossiers_employes",
      timestamps: true,
    },
  )

  return DossierEmploye
}
