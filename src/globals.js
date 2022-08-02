'use strict'

class Enum {
  static *[Symbol.iterator]() {
    for (const value of Object.values(this)) {
      yield value
    }
  }
}

class CollectionNameEnum extends Enum {
  static CONTINGENT = 'contingent'
  static EMPLOYEE = 'employee'
  static LPU = 'lpu'
}

module.exports = {
  CollectionNameEnum
}
