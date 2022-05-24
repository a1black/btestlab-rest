'use strict'

const bootstrap = require('./src')

async function start() {
  const [, listen] = await bootstrap()
  listen()
}

start().catch(console.error)
