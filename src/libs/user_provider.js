'use strict'

const { CollectionNameEnum } = require('../globals')

/**
 * @param {string | number} id User unique identifier.
 * @param {{ source: import("mongodb").Db }} options Provider options.
 * @returns {Promise<User?>}
 */
module.exports = async (id, options) => {
  const _id = typeof id === 'number' ? id : parseInt(id)
  /** @type {import("mongodb").Collection<User>} */
  const collection = options.source.collection(CollectionNameEnum.USER)

  return isNaN(_id) ? null : collection.findOne({ _id })
}
