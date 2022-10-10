'use strict'

/**
 * @typedef {object} QuestionOptions
 * @property {(value: string) => any} [adjust] Function to modify input value before validation.
 * @property {string} errmsg Error message on invalid input value.
 * @property {string} prompt Input prompt.
 * @property {string} prop Field of employee document.
 * @property {boolean} [required=true] Field presence.
 * @property {readline.Interface} rl Instance of I/O stream.
 * @property {import("joi").ObjectSchema} schema Schema to validate employee document.
 */

const Joi = require('joi')
const mongodb = require('mongodb')
const readline = require('readline')
const utils = require('node:util')

const configuration = require('../src/configs')
const employeeDataAccessor = require('../src/services/employee/lib/employee_data_accessor')
const employeeSchema = require('../src/services/employee/lib/employee_schema')
const { isDuplicateMongoError } = require('../src/libs/mongo/utils')
const {
  formatEmployeeDoc,
  hashPassword
} = require('../src/services/employee/lib/employee_helper_functions')

/**
 * @param {QuestionOptions} options Prompt options.
 * @returns {Promise<any>} Validated user input.
 */
async function ask(options) {
  const { adjust, errmsg, prompt, prop, required = true, rl, schema } = options
  const question = utils.promisify(rl.question).bind(rl)
  let attempts = 10

  while (attempts > 0) {
    const answer = await question(prompt + ': ')
    const { error, value } = schema
      .extract(prop)
      .presence(required ? 'required' : 'optional')
      // @ts-ignore
      .validate(adjust ? adjust(answer) : answer)

    if (error) {
      rl.write(errmsg + '\n')
      attempts--
    } else {
      return value
    }
  }

  throw new Error('Too much invalid attempts, see config for input limitations')
}

/**
 * Requests confirmation to create new user.
 *
 * @param {readline.Interface} rl Readable and writable stream.
 * @param {Collection.OmitBase<Collection.Employee>} user Schema to validate employee document.
 * @returns {Promise<boolean>}
 */
async function confirmation(rl, user) {
  const fuser = formatEmployeeDoc(user)
  rl.write('\nПодтвердите данные:\n')
  rl.write(`  Имя: ${fuser.lastname} ${fuser.firstname} ${fuser.middlename}\n`)
  rl.write(`  Дата рожд.: ${fuser.birthdate}\n`)
  rl.write(`  Пол: ${fuser.sex}\n`)
  rl.write(`  Администратор: ${fuser.admin ? 'да' : 'нет'}\n`)
  rl.write(`  Пароль: ${user.password ?? "'не задан'"}\n`)

  const question = utils.promisify(rl.question).bind(rl)
  const answer = await question('Создать пользователя [да/нет]: ')

  // @ts-ignore
  return /^[yд]/iu.test(answer)
}

/**
 * Initializes configuration and database connection.
 */
async function bootstrap() {
  const { db, input, general, genops } = await configuration()
  const client = await mongodb.MongoClient.connect(db.uri)
  const close = () => client.close(true)
  const schema = employeeSchema
    .employeeDoc(input.employee)
    .append({ admin: Joi.boolean().default(false) })
  /** @type {(raw: string) => Promise<string>} */
  const hashpass = raw =>
    hashPassword(raw, { hashSize: general.passwdHashSize })

  try {
    return {
      close,
      dataAccessor: employeeDataAccessor(
        client.db(db.dbname),
        genops.employeeId
      ),
      hashpass,
      schema
    }
  } catch (error) {
    await close()
    throw error
  }
}

/**
 * @param {readline.Interface} rl Readable and writable stream.
 * @param {import("joi").ObjectSchema} schema Schema to validate employee document.
 * @returns {Promise<Collection.OmitBase<Collection.Employee>>}
 */
async function inputDoc(rl, schema) {
  /** @type {any} */
  const doc = {}
  const askOps = [
    { errmsg: 'Некорректная фамилия', prop: 'lastname', prompt: 'Фамилия' },
    { errmsg: 'Некорректное имя', prop: 'firstname', prompt: 'Имя' },
    { errmsg: 'Некорректное отчество', prop: 'middlename', prompt: 'Отчество' },
    {
      errmsg: 'Введите корректную дату в формате: гггг-мм-дд',
      prop: 'birthdate',
      prompt: 'Дата рождения (гггг-мм-дд)'
    },
    {
      errmsg: "Пол должен быть 'м' или 'ж'",
      prop: 'sex',
      prompt: 'Пол [м/ж]',
      /** @type {(value: string) => string} */
      adjust: value =>
        /^м/iu.test(value.trim())
          ? 'm'
          : /^ж/iu.test(value.trim())
          ? 'f'
          : value
    },
    {
      errmsg: 'Некорректное значение',
      prop: 'admin',
      prompt: 'Админ [да/нет]',
      /** @type {(value: string) => boolean} */
      adjust: value => /^[yд]/iu.test(value.trim())
    }
  ]

  for (const options of askOps) {
    doc[options.prop] = await ask({ rl, schema, ...options })
  }

  const isAdmin = doc.admin === true
  const password = await ask({
    rl,
    schema,
    errmsg: 'Некорректный пароль',
    prop: 'password',
    prompt: `Пароль (${isAdmin ? '' : 'не'}обязательное поле)`,
    required: isAdmin
  })

  if (password) {
    doc.password = password
  }

  return doc
}

async function main() {
  const { close, dataAccessor, hashpass, schema } = await bootstrap()
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  try {
    const doc = await inputDoc(rl, schema)
    const confirm = await confirmation(rl, doc)

    if (confirm) {
      doc.admin !== true && delete doc.admin
      if (doc.password) {
        doc.password = await hashpass(doc.password)
      } else {
        delete doc.password
      }

      // @ts-ignore
      await dataAccessor.create(doc)
      rl.write('Пользователь создан\n')
    } else {
      rl.write('Операция отменена\n')
    }
  } catch (error) {
    if (isDuplicateMongoError(error)) {
      rl.write('\nОшибка: Пользователь уже существует\n')
    } else {
      rl.write(`\nError: ${error}\n`)
    }
  } finally {
    await close()
    rl.close()
  }
}

main()
