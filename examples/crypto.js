'use strict'

const Max7219 = require('..')
const got = require('got')
const m = new Max7219({ device: '/dev/spidev0.0', controllerCount: 4, flip: 'vertical' })

async function latest () {
  const { body } = await got('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD', {
    json: true
  })
  console.log(body)
  return body.USD.toString().split('.')[0].split('')
}

async function init () {
  await m.reset(0)
  await m.reset(1)
  await m.reset(2)
  await m.reset(3)
  await m.letter(0, '$')

  setInterval (async () => {
    console.log('call')
    const digits = await latest()

    await m.letter(1, digits[0])
    await m.letter(2, digits[1])
    await m.letter(3, digits[2])
  }, 15000)
}

init()
