/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 'use strict'

 const SPI = require('pi-spi')
 const { flip, rotate } = require('./transformations')
 const { getFont } = require('./fonts')
 const { Registers } = require('./registers')
 
 function setController (instance, requested = 1) {
   if (requested < 0 || requested >= instance.controllerCount) { 
     throw new Error(`Requested controller ${requested} is not configured.`)
   }
   instance.activeController = requested
 }
 
 async function shiftOut (instance, firstByte, secondByte) {
   return new Promise(resolve => {
     for (let i = 0; i < instance.buffer.length; i += 2) {
       instance.buffer[i] = Registers.NoOp
       instance.buffer[i + 1] = 0x00
     }
 
     const offset = instance.activeController * 2
     instance.buffer[offset] = firstByte
     instance.buffer[offset + 1] = secondByte

     instance.spi.write(instance.buffer, err => {
      if (err) { throw err }
       resolve()
     })
   })
 }
 
 function encodeByte (bits) {
   return bits.reduce((curr, next, i) => {
     return curr + (next << i)
   }, 0)
 }

 function encodeMatrix (instance, matrix) {
  matrix = rotate(matrix, instance.rotate)
  matrix = flip(matrix, instance.flip)

  const rows = matrix.map((row, i) => {
    if (row.length !== 8) {
      throw new Error('Matrix width must be exactly 8')
    }

    return shiftOut(instance, Registers[ `Digit${i}` ], encodeByte(row))
  })

  return Promise.all(rows)
 }

 function charToMatrix (char) {
  return char.map(row => {
   const bin = row.toString(2)
   return bin
     .padStart(8, '0')
     .split('')
     .map(i => parseInt(i))
  })
}

 function emptyMatrix () {
   return new Array(8).fill(new Array(8).fill(0))
 }

 const defaults = {
   device: '/dev/spidev0.0',
   controllerCount: 1,
   flip: 'none',
   rotate: 0,
   font: 'sinclair'
 }
 
 module.exports = class Max7219 {
   constructor (options = {}) {
     const config = Object.assign({}, defaults, options)
 
     this.spi = SPI.initialize(config.device)
     this.controllerCount = config.controllerCount
     this.buffer = new Buffer(config.controllerCount * 2)
     this.activeController = 0
     this.rotate = config.rotate
     this.flip = config.flip
     this.font = getFont(config.font)
   }
 
   async reset (controller) {
     setController(this, controller)
     const zeroArray = new Array(8).fill(0)
     await shiftOut(this, Registers.DecodeMode, encodeByte(zeroArray))
     await shiftOut(this, Registers.ScanLimit, 7)
     await shiftOut(this, Registers.Shutdown, 0x01)
     await this.clear(controller)
   }

   async clear (controller) {
     setController(this, controller)
     const matrix = emptyMatrix()
     await this.set(controller, matrix)
   }
 
   async set (controller, matrix) {
     setController(this, controller)
     if (matrix.length !== 8) {
       throw new Error('Matrix height must be exactly 8')
     }

     return encodeMatrix(this, matrix, encodeByte)
   }
 
   async letter (controller, letter) {
    setController(this, controller)
    const ascii = letter.charCodeAt(0)
    const char = this.font[ascii]
    const matrix = charToMatrix(char)
    return encodeMatrix(this, matrix)
   }

   async setIntensity (controller, brightness) {
     setController(this, controller)
     if (0 > brightness > 15) {
       throw new Error('Brightness must be between 0 and 15')
     }
     await shiftOut(this, Registers.Intensity, brightness)
   }
 }
 