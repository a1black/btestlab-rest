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
  static USER = 'employee'
}

class SexEnum extends Enum {
  /** @type {"f"} */
  static FEMALE = 'f'
  /** @type {"m"} */
  static MALE = 'm'
}

module.exports = {
  CollectionNameEnum,
  SexEnum
}
