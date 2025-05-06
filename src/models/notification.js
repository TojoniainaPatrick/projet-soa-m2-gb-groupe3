module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.ENUM("email", "sms", "interne"),
        allowNull: false,
        defaultValue: "email",
      },
      destinataire: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sujet: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contenu: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      statut: {
        type: DataTypes.ENUM("envoyé", "échec", "en_attente"),
        allowNull: false,
        defaultValue: "en_attente",
      },
      dateEnvoi: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      erreur: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      conseillerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "conseillers",
          key: "id",
        },
      },
      dossierId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "dossiers_employes",
          key: "id",
        },
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
      tableName: "notifications",
      timestamps: true,
    },
  )

  return Notification
}
