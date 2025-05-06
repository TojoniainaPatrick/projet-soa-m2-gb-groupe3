const { clientsDB, assurancesDB } = require("../models/models")

/**
 * Exécute une fonction dans une transaction distribuée
 * @param {Function} callback - Fonction à exécuter dans la transaction
 * @returns {Promise<any>} - Résultat de la fonction
 */
async function executeInTransaction(callback) {
  // Démarrer les transactions dans les deux bases
  const clientsTransaction = await clientsDB.transaction()
  const assurancesTransaction = await assurancesDB.transaction()

  try {
    // Exécuter la fonction avec les transactions
    const result = await callback(clientsTransaction, assurancesTransaction)

    // Si tout s'est bien passé, valider les transactions
    await clientsTransaction.commit()
    await assurancesTransaction.commit()

    return result
  } catch (error) {
    // En cas d'erreur, annuler les transactions
    await clientsTransaction.rollback()
    await assurancesTransaction.rollback()
    throw error
  }
}

module.exports = {
  executeInTransaction,
}
