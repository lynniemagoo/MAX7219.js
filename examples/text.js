'use strict'

const Max7219 = require('..')
const m = new Max7219({ device: '/dev/spidev0.0', controllerCount: 4, flip: 'vertical' })

async function init () {
  await m.reset(0)
  await m.reset(1)
  await m.reset(2)
  await m.reset(3)
  await m.letter(0, 'M')
  await m.letter(1, 'E')
  await m.letter(2, 'A')
  await m.letter(3, 'K')
}

init()
