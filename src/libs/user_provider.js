'use strict'

const objectSet = require('./objectset')
const { CollectionNameEnum } = require('../globals')

/**
 * @param {Partial<Record<keyof User, any>>} data Authenticated user information.
 * @returns {Partial<User>} Instance of application user.
 */
function anonymousUser(data) {
  const user = { admin: data.admin === true }

  objectSet(user, 'firstname', data.firstname?.lowercase())
  objectSet(user, 'lastname', data.lastname?.lowercase())
  objectSet(user, 'middlename', data.middlename?.lowercase())
  objectSet(user, 'sex', data.sex)

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
