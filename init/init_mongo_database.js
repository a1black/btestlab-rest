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

// Create lpu collection and indexes
db.getCollection('lpu').createIndex({ _hash: 1 }, { unique: true })
