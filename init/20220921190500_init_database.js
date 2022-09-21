'use strict'

// Create collections that require additional configuration
db.createCollection('examination', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'accounted',
        'contingent',
        'location',
        'lpu',
        'number',
        'result',
        'type'
      ],
      properties: {
        accounted: { bsonType: 'date' }
      }
    }
  }
})

// Create indexes
db.employee.createIndex(
  { lastname: 1, firstname: 1, middlename: 1, birthdate: 1 },
  { name: 'fullname_birthdate', unique: true }
)

db.examination.createIndex(
  { type: 1, accounted: 1, number: 1 },
  { name: 'unique_exam_number', unique: true }
)

db.lpu.createIndex({ uid: 1 }, { unique: true })
