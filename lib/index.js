/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 'use strict'

const SPI = require('pi-spi')
const {transform} = require('./transformations')
const { getFont } = require('./fonts')
const { Registers } = require('./registers')

const off = 0x00
const on = 0x01

const scrollOptions = {
  speed: 100,
  loop: true,
  scrollIn: false,
  glyphRotate: 0,
  glyphFlip: 'none',
  scrollIncrement: 1
}

const defaults = {
   device: '/dev/spidev0.0',
   controllerCount: 1,
   flip: 'none',
   rotate: 0,
   font: 'sinclair',
   reverseDisplayOrdering: false
}

 class Max7219FontAdapter {
   constructor (fontName) {
     this.font = getFont(fontName);
   }

   getMatrix (letter) {
     const ascii = letter.charCodeAt(0)
     const charData = this.font[ascii]
     const charDataLength = charData.length

     if (charDataLength < 8) {
       const theArray = [0,0,0,0,0,0,0,0]
       if (charDataLength > 0) {
         const theArgs = [0, charDataLength].concat(charData)
         Array.prototype.splice.apply(theArray, theArgs)
       }
      return theArray
    }
    return charData
   }
 }

 class OledFontAdapter {
   constructor (font) {
       const OHOP = Object.prototype.hasOwnProperty;
       if (!font) {
         throw new Error("Invalid Font. Font specified is null or undefined.")
       }

       if (!(OHOP.call(font, 'width') && OHOP.call(font, 'height') && OHOP.call(font, 'lookup') && OHOP.call(font, 'fontData'))) {
         throw new Error("Unsupported Font. Font must be compliant with oled-font-pack font.")
       }

       if (font.height > 8 || font.width > 8) {
         throw new Error("Unsupported Oled Font. Both Oled font height and width must be <=8.")
       }

       this.font = font;
   }

   getMatrix (letter) {
     const font = this.font;
     const ascii = letter.charAt(0)
     const width = font.width
     const lookup = font.lookup
     const fontData = font.fontData

     let lookupIndex = lookup.indexOf(ascii)
     if (lookupIndex < 0) {
       lookupIndex = font.lookup.indexOf(' ')
     }

     if (lookupIndex < 0) {
       lookupIndex = font.lookup.indexOf('\x00')
     }

     if (lookupIndex < 0) {
       throw new Error('The letter requested is not in the Oled font and the Oled font does not contain a glyph for space or \\x00.')
     }

     const dataStart = lookupIndex * width
     const charData = fontData.slice(dataStart, dataStart + width)
     const charDataLength = charData.length

     if (charDataLength < 8) {
       const theArray = [0,0,0,0,0,0,0,0]
       if (charDataLength > 0) {
         const theArgs = [0, charDataLength].concat(charData)
         Array.prototype.splice.apply(theArray, theArgs)
       }
       return theArray
     }
     return charData
   }
 }

 module.exports = class Max7219 {
   constructor (options = {}) {
     const config = Object.assign({}, defaults, options)

     this.spi = SPI.initialize(config.device)
     this.controllerCount = config.controllerCount
     this.buffer = Buffer.alloc(config.controllerCount * 2)
     this.activeController = 0
     this.rotate = config.rotate
     this.flip = config.flip
     this.fontAdapter = Max7219.createFontAdapter(config.font);
     this.transform = transform
     this.reverseDisplayOrdering = config.reverseDisplayOrdering
   }

   setController (requested = 0) {
     if (requested < 0 || requested >= this.controllerCount) {
       throw new Error(`Requested controller ${requested} is not configured.`)
     }
     this.activeController = requested
   }

   async displayTest (controller, enable) {
     return this.displayTestSingle(controller, enable)
   }

   async displayTestSingle (controller, enable) {
     this.setController(controller)
     return this.shiftOut(Registers.DisplayTest, enable ? on : off)
   }

   async displayTestAll (enable) {
     const rows = []
     for (let controller = 0; controller < this.controllerCount; controller++) {
       rows.push(this.displayTestSingle(controller, enable))
     }
     return Promise.all(rows);
   }

   async reset (controller) {
     return this.resetSingle(controller)
   }

   async resetSingle (controller) {
     const zeroArray = new Array(8).fill(0)
     this.setController(controller)
     await this.shiftOut(Registers.DecodeMode, 0)
     await this.shiftOut(Registers.ScanLimit, 7)
     await this.shiftOut(Registers.Shutdown, on)
     await this.displayTest(controller, false)
     return  this.clearSingle(controller)
   }

   async resetAll () {
     for (let controller = 0; controller < this.controllerCount; controller++) {
       await this.resetSingle(controller)
     }
   }

   async clear (controller) {
       return this.clearSingle (controller);
   }

   async clearSingle (controller) {
     this.setController(controller)
     return this.installMatrix(controller, Max7219.emptyMatrix())
   }

   async clearAll () {
     for (let controller = 0; controller < this.controllerCount; controller++) {
       await this.clearSingle(controller)
     }
   }

   async setIntensity (controller, brightness) {
       return this.setIntensitySingle(controller, brightness)
   }

   async setIntensitySingle (controller, brightness) {
     if (0 > brightness > 15) {
       throw new Error('Brightness must be between 0 and 15')
     }
     this.setController(controller)
     return this.shiftOut(Registers.Intensity, brightness)
   }

   async setIntensityAll (brightness) {
     for (let controller = 0; controller < this.controllerCount; controller++) {
       await this.setIntensitySingle(controller, brightness)
     }
   }

   async set (controller, matrix) {
     if (matrix.length !== 8) {
       throw new Error('Matrix height must be exactly 8')
     }
     if (!matrix.every((element)=>(element.length == 8))) {
       throw new Error('Matrix width must be exactly 8')
     }

     return this.installMatrix(controller, this.transform(matrix.map(element=>Max7219.encodeByte(element)), this.rotate, this.flip));
   }

   async letter (controller, letter) {
    return this.installMatrix(controller, this.transform(this.fontAdapter.getMatrix(letter), this.rotate, this.flip));
   }

   async display (text, start = 0, length = -1) {
     const controllerCount = this.controllerCount;
     let displayText = text;
     // skip past start characters if start > 0
     if (start > 0) {
         displayText = displayText.substring(start);
     }

     // Ensure we don't have more characters than controllers and ensure if text is too short we pad to controllerCount
     // length with spaces.
     let displayTextLength = Math.min(controllerCount, (length >= 0 && length <= displayText.length) ? length : displayText.length);
     displayText = displayText.substring(0, Math.min(controllerCount,displayTextLength)).padEnd(controllerCount, ' ');
     for (let ctrl = 0; ctrl < this.controllerCount; ctrl++) {
        await this.letter(ctrl, displayText.charAt(ctrl));
     }
   }

   async scroll (text, options) {
     const conf = { ...scrollOptions, ...options }
     const scrollIn = conf.scrollIn;
     const scrollIncrement = conf.scrollIncrement
     const glyphRotate = conf.glyphRotate
     const glyphFlip = conf.glyphFlip
     const matrixSize = 8;

     if (![0, 90, 180, 270].includes(glyphRotate)) {
        throw new Error("Value for 'glyphRotate' must be 0, 90, 180, or 270 degrees.")
     }

     /********************************************************************************************************
      *  By default, glyphs in fonts are already rotated at 90 degrees.
      *  The default transformation algorithm performs as follows:
      *
      *  Rotation   0 - Rotates the matrix 90 degrees counter-clockwise.
      *  Rotation  90 - Returns the matrix as-is.
      *  Rotation 180 - Rotates the matrix 90 degrees clockwise.
      *  Rotation 270 - Rotates the matrix 180 degrees clockwise/counter-clockwise.
      *
      *  So, if user wants glyphRotation of 90 degrees, for example, we must use the table below to determine
      *  the actual rotation we must provide which is 180.  For 0 degrees, we must provide a value of 180 to
      *  the transformation algorithm.
      *
      *    0 --> 90
      *   90 --> 180
      *  180 --> 270
      *  270 --> 360
      *
      *  The adjusted rotation is glyphRotate + 90 modulo 360.
      *******************************************************************************************************/
     const adjustedGlyphRotate = (glyphRotate + 90) % 360

     let adjustedScrollIncrement = scrollIncrement;

     if (adjustedScrollIncrement <= 0) {
       adjustedScrollIncrement = 1;
     }

     // Ensure we don't scroll more than the number of pixels we have in our matrices.
     adjustedScrollIncrement = Math.min(this.controllerCount * matrixSize, adjustedScrollIncrement)

     let displayText = text;
     if (scrollIn) {
         // Left pad of spaces for controller count facilitates smooth scroll into display.
         displayText = displayText.padStart(displayText.length + this.controllerCount, ' ');
     }
     const chars = displayText.split('')
     do {
       const rows = chars.reduce((out, letter) => {
           out = out.concat(this.transform(this.fontAdapter.getMatrix(letter), adjustedGlyphRotate, glyphFlip));
           return out;
       }, [])

       const paddedCount = (rows.length + (matrixSize * this.controllerCount)) / adjustedScrollIncrement;

       for (let iteration = 0; iteration < paddedCount; iteration++) {
          for (let ctrl = 0; ctrl < this.controllerCount; ctrl++) {
              let offset = ctrl * matrixSize;
              let matrix = rows.slice(offset, offset + matrixSize)
              if (matrix.length < matrixSize) {
                const oldSize = matrix.length;
                matrix.length = matrixSize;
                matrix.fill(0, oldSize);
              }
              await this.installMatrix(ctrl, this.transform(matrix, this.rotate, this.flip))
          }
          let shiftCount = adjustedScrollIncrement;
          while (shiftCount--) {
            if (rows.length) {
              rows.shift()
            }
          }
          await new Promise(resolve => setTimeout(resolve, conf.speed))
       }
     } while (conf.loop);
   }

   async shiftOut (firstByte, secondByte) {
     let instance = this;
     return new Promise((resolve,reject) => {
       for (let i = 0; i < instance.buffer.length; i += 2) {
         instance.buffer[i] = Registers.NoOp
         instance.buffer[i + 1] = 0x00
       }
       const selectedController = instance.activeController;
       // new code to support reversing display order if needed (rotation outside of 0 degrees may require you to change this.
       let  offset = (instance.reverseDisplayOrdering ?  instance.controllerCount - 1 - selectedController : selectedController) * 2;
       instance.buffer[offset] = firstByte
       instance.buffer[offset + 1] = secondByte

       instance.spi.write(instance.buffer, err => {
         if (err) { reject(err) }
         resolve()
        })
     })
   }

   installMatrix (controller, matrix) {
     this.setController(controller)
     if (matrix.length != 8) {
       throw new Error('Matrix height must be exactly 8')
     }
     const columns = matrix.map((column, i) => {
       if ((column < 0 || column > 0xFF)) {
         throw new Error('Matrix column byte value must be between 0 and 255 inclusive.')
       }
       return this.shiftOut(Registers[ `Digit${i}` ], column)
     })

     return Promise.all(columns)
   }

   static emptyMatrix () {
     return [0,0,0,0,0,0,0,0]
   }

   static createFontAdapter (fontNameOrFont) {
     return typeof(fontNameOrFont) === 'string' ? new Max7219FontAdapter(fontNameOrFont) : new OledFontAdapter(fontNameOrFont);
   }

   static encodeByte (bits) {
     return bits.reduce((curr, next, i) => {
       return curr + (next << i)
     }, 0)
   }
 }
