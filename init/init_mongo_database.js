// @ts-nocheck
'use strict'

// Create contingent collection and indexes
db.getCollection('contingent').createIndex(
  { dtime: 1, code: 1 },
  { unique: true }
)

// Create employee collection and indexes
db.getCollection('employee').createIndex(
  { lastname: 1, firstname: 1, middlename: 1, birthdate: 1 },
  { unique: true }
)

// Create examination collectn and indexes
db.getCollection('examination').createIndex(
  { type: 1, accounted: 1, number: 1 },
  { unique: true, name: 'examimation_id' }
)

// Create lpu collection and indexes
db.getCollection('lpu').createIndex({ _hash: 1 }, { unique: true })
