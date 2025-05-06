module.exports = (sequelize, DataTypes) => {
  const Beneficiaire = sequelize.define(
    "Beneficiaire",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      policeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "polices_assurance_vie",
          key: "id",
        },
      },
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prenom: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateNaissance: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      lienParente: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pourcentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      ordre: {
        type: DataTypes.INTEGER,
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
      tableName: "beneficiaires",
      timestamps: true,
    },
  )

  return Beneficiaire
}
