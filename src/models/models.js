const clientsDB = require("../config/database-clients")
const assurancesDB = require("../config/database-assurances")
const { DataTypes } = require("sequelize")

// Import des modèles de la base clients
const Employe = require("./employe")(clientsDB, DataTypes)
const Conseiller = require("./conseiller")(clientsDB, DataTypes)
const DossierEmploye = require("./dossierEmploye")(clientsDB, DataTypes)
const Notification = require("./notification")(clientsDB, DataTypes)

// Import des modèles de la base assurances
const Beneficiaire = require("./beneficiaire")(assurancesDB, DataTypes)
const PoliceAssuranceVie = require("./policeAssuranceVie")(assurancesDB, DataTypes)
const CompagnieAssurance = require("./compagnieAssurance")(assurancesDB, DataTypes)

// Définition des associations dans la même base de données
// Base clients
Employe.hasMany(DossierEmploye, { foreignKey: "employeId" })
DossierEmploye.belongsTo(Employe, { foreignKey: "employeId" })

Conseiller.hasMany(DossierEmploye, { foreignKey: "conseillerId" })
DossierEmploye.belongsTo(Conseiller, { foreignKey: "conseillerId" })

Conseiller.hasMany(Notification, { foreignKey: "conseillerId" })
Notification.belongsTo(Conseiller, { foreignKey: "conseillerId" })

DossierEmploye.hasMany(Notification, { foreignKey: "dossierId" })
Notification.belongsTo(DossierEmploye, { foreignKey: "dossierId" })

// Base assurances
PoliceAssuranceVie.hasMany(Beneficiaire, { foreignKey: "policeId" })
Beneficiaire.belongsTo(PoliceAssuranceVie, { foreignKey: "policeId" })

CompagnieAssurance.hasMany(PoliceAssuranceVie, { foreignKey: "compagnieId" })
PoliceAssuranceVie.belongsTo(CompagnieAssurance, { foreignKey: "compagnieId" })

module.exports = {
  clientsDB,
  assurancesDB,
  Employe,
  Conseiller,
  DossierEmploye,
  Notification,
  Beneficiaire,
  PoliceAssuranceVie,
  CompagnieAssurance,
}
