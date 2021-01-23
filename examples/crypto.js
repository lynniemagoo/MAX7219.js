'use strict'

const Max7219 = require('..')
const m = new Max7219({ device: '/dev/spidev0.0', controllerCount: 4})
const fetch = require('node-fetch')

async function latest () {
  const res = await fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD')
  const body = await res.json()
  return body.USD.toString().split('.')[0].split('')
}

async function init () {
  await m.resetAll();
  await m.letter(0, '$')

  setInterval (async () => {
    const digits = await latest()

    await m.letter(1, digits[0])
    await m.letter(2, digits[1])
    await m.letter(3, digits[2])
  }, 15000)
}

init()
