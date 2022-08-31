'use strict'

const {
  capitalize,
  dateToShortISOString
} = require('../../../libs/functional_helpers')
const { responseObjectSet } = require('../../../libs/http_service_helpers')

/**
 * Produces copy of a document that can be returned by HTTP service.
 *
 * @param {Partial<Collection.Examination>} doc Examination document.
 * @returns {Dict<any>} Formatted response document.
 */
function formatExaminationDoc(doc) {
  return responseObjectSet({}, [
    ['id', doc.uid],
    ['type', doc.type],
    ['contingent', doc.contingent],
    ['location', doc.location],
    ['lpu', doc.lpu],
    ['taken', dateToShortISOString(doc.taken)],
    ['delivered', dateToShortISOString(doc.delivered)],
    ['examined', dateToShortISOString(doc.examined)],
    ['patient', formatPatientDoc(doc.patient)],
    ['author', formatUserDoc(doc.cuser)],
    ['editor', formatUserDoc(doc.muser)],
    ['created', doc.ctime?.getTime()],
    ['modified', doc.mtime?.getTime()]
  ])
}

/**
 * @param {Collection.Examination["patient"]} [doc] Patient document.
 * @returns {Dict<string>?} Formatted document.
 */
function formatPatientDoc(doc) {
  const patient = responseObjectSet(formatUserDoc(doc) ?? {}, [
    ['residence', doc?.residence],
    ['birthdate', dateToShortISOString(doc?.birthdate)],
    ['sex', doc?.sex]
  ])

  return Object.keys(patient).length ? patient : null
}

/**
 * @param {{ firstname?: string, lastname?: string, middlename?: string }} [doc] User document.
 * @retrun {Dict<string>?} Formatted document.
 */
function formatUserDoc(doc) {
  const user = responseObjectSet({}, [
    ['firstname', capitalize(doc?.firstname)],
    ['lastname', capitalize(doc?.lastname)],
    ['middlename', capitalize(doc?.middlename)]
  ])

  return Object.keys(user).length ? user : null
}

module.exports = {
  formatExaminationDoc
}
