'use strict'

/**
 * @typedef {import("express").Request} Request
 */

const dateutils = require('../../../libs/date_utils')
const urlpath = require('../../../libs/urlpath')
const { responseObjectSet } = require('../../../libs/http_utils')
const { capitalize } = require('../../../libs/utils')

/**
 * @param {Partial<Collection.Examination>} doc Examination document.
 * @returns {Dict<any>} Formatted response document.
 */
function formatExaminationDoc(doc) {
  return responseObjectSet({}, [
    ['accounted', dateutils.toShortISOString(doc.accounted)],
    ['number', doc.number],
    ['type', doc.type],
    ['contingent', doc.contingent],
    ['location', doc.location],
    ['lpu', doc.lpu],
    ['taken', dateutils.toShortISOString(doc.taken)],
    ['delivered', dateutils.toShortISOString(doc.delivered)],
    ['examined', dateutils.toShortISOString(doc.examined)],
    ['patient', formatPatientDoc(doc.patient)],
    ['result', doc.result],
    // NOTE: If `doc.tests` is count, then exclude `0` from the response.
    ['tests', doc.tests || undefined],
    ['author', formatUserDoc(doc.cuser)],
    ['editor', formatUserDoc(doc.muser)],
    ['created', doc.ctime?.getTime()],
    ['modified', doc.mtime?.getTime()],
    ['deleted', doc.dtime?.getTime()],
    // NOTE: Service field needed for url creation on client side.
    [
      '_date',
      dateutils.toShortISOString(doc.accounted)?.replaceAll(/-\d+$|-/g, '')
    ]
  ])
}

/**
 * @param {Collection.Examination["patient"]} [doc] Patient document.
 * @returns {Dict<string>} Formatted document.
 */
function formatPatientDoc(doc) {
  return responseObjectSet(formatUserDoc(doc), [
    ['residence', doc?.residence],
    ['birthdate', dateutils.toShortISOString(doc?.birthdate)],
    ['sex', doc?.sex]
  ])
}

/**
 * @param {{ firstname?: string, lastname?: string, middlename?: string }} [doc] User document.
 * @retrun {Dict<string>} Formatted document.
 */
function formatUserDoc(doc) {
  return responseObjectSet({}, [
    ['firstname', capitalize(doc?.firstname)],
    ['lastname', capitalize(doc?.lastname)],
    ['middlename', capitalize(doc?.middlename)]
  ])
}

/**
 * @param {Request} req Client HTTP request.
 * @param {Partial<Collection.Examination>} doc Examination document.
 */
function linkExaminationDoc(req, doc) {
  const basepath = [req.config('routes.examination')]
  const { _date, number, type, deleted } = formatExaminationDoc(doc)
  const url = urlpath([
    ...basepath,
    type ?? ':type',
    _date ?? ':_date',
    number ?? ':number'
  ])

  type && basepath.push(type)

  return responseObjectSet({}, [
    ['create', urlpath(basepath)],
    ['read', url],
    ['update', deleted === undefined ? url : undefined],
    ['delete', deleted === undefined ? url : undefined]
  ])
}

module.exports = {
  formatExaminationDoc,
  linkExaminationDoc
}
