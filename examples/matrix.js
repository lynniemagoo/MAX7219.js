'use strict'

const Max7219 = require('..')
const m = new Max7219({ device: '/dev/spidev0.0', controllerCount: 4, flip: 'vertical' })

const matrix = [
  [0,0,0,0,0,0,0,0],
  [0,1,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,1,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0],
  [0,1,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0]
]

async function init () {
  await m.reset(0)
  await m.set(0, matrix)
}

init()

