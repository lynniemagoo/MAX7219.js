'use strict'

const Max7219 = require('..')
const controllerCount = 4

const m = new Max7219({ device: '/dev/spidev0.0', controllerCount, reversedDisplayOrdering: true, flip: 'both', rotate: 180})

async function init () {
  for (let i = 0; i < controllerCount; i++) {
    await m.reset(i)
  }
  await m.scroll('HELLO WORLD',{scrollIn: true, loop: false, speed: 100})
  await m.resetAll();
}

init()
