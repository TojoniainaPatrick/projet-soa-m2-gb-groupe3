module.exports = (sequelize, DataTypes) => {
  const PoliceAssuranceVie = sequelize.define(
    "PoliceAssuranceVie",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      dossierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      compagnieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "compagnies_assurance",
          key: "id",
        },
      },
      numeroPolice: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dateEffet: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dateExpiration: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      capitalAssure: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      primeMensuelle: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      typeContrat: {
        type: DataTypes.ENUM("individuel", "collectif"),
        allowNull: false,
      },
      statut: {
        type: DataTypes.ENUM("actif", "suspendu", "résilié"),
        defaultValue: "actif",
      },
      clauseBeneficiaire: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      options: {
        type: DataTypes.JSONB,
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
      tableName: "polices_assurance_vie",
      timestamps: true,
    },
  )

  return PoliceAssuranceVie
}
