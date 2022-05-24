'use strict'

class Enum {
  static *[Symbol.iterator]() {
    for (const value of Object.values(this)) {
      yield value
    }
  }
}

class CollectionNameEnum extends Enum {
  static EMPLOYEE = 'employee'
}

class ConstantEnum extends Enum {
  // MUST NOT be increased
  static PASSWORD_MIN_LENGTH = 8
}

module.exports = {
  CollectionNameEnum,
  ConstantEnum
}
