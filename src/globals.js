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
  static EXAMINATION = 'examination'
  static LPU = 'lpu'
  static USER = 'employee'
}

class ExaminationTypeEnum extends Enum {
  /** @type {"hcv"} */
  static HCV = 'hcv'
  /** @type {"hiv"} */
  static HIV = 'hiv'
}

class SexEnum extends Enum {
  /** @type {"f"} */
  static FEMALE = 'f'
  /** @type {"m"} */
  static MALE = 'm'
}

class TestPositiveEnum extends Enum {
  /** @type {-1} */
  static INDETERMINATE = -1
  /** @type {0} */
  static NEGATIVE = 0
  /** @type {1} */
  static POSITIVE = 1
}

module.exports = {
  CollectionNameEnum,
  ExaminationTypeEnum,
  SexEnum,
  TestPositiveEnum
}
