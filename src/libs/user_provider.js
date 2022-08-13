'use strict'

const { CollectionNameEnum } = require('../globals')
const { objectSetShallow } = require('./functional_helpers')

/**
 * @param {Partial<Record<keyof User, any>>} data Verified data of authenticated user.
 */
function anonymousUser(data) {
  const /** @type {Partial<User>} */ user = { admin: data.admin === true }

  objectSetShallow(user, 'firstname', data.firstname?.trim() || null)
  objectSetShallow(user, 'lastname', data.lastname?.trim() || null)
  objectSetShallow(user, 'middlename', data.middlename?.trim() || null)
  objectSetShallow(user, 'sex', data.sex?.trim() || null)

  return user
}

/**
 * @param {string | number} id User unique identifier.
 * @param {{ source: import("mongodb").Db }} options Provider options.
 * @returns {Promise<User?>}
 */
async function findUser(id, options) {
  const _id = typeof id === 'number' ? id : parseInt(id)
  /** @type {import("mongodb").Collection<User>} */
  const collection = options.source.collection(CollectionNameEnum.USER)

  return isNaN(_id) ? null : collection.findOne({ _id })
}

module.exports = {
  anonymous: anonymousUser,
  registrated: findUser
}
