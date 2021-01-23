'use strict'

const Max7219 = require('..')
const m = new Max7219({ device: '/dev/spidev0.0', reverseDisplayOrdering:false, controllerCount: 4})

async function init () {
  await m.resetAll();
  await m.letter(0, 'M')
  await m.letter(1, 'E')
  await m.letter(2, 'A')
  await m.letter(3, 'K')
}

init()
