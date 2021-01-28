## Max7219

![publish](https://github.com/antony/MAX7219.js/workflows/publish/badge.svg)

Display driver for MAX7219 designed for raspberry pi.

Uses Promises and works on recent versions of node ( > 4 ). Tested up to Node v10.

### Installing

```bash
  npm install --save max7219-display
```

### Configuring your PI

If you haven't already, enter `raspi-config` and enable `SPI` under `I/O Configuration`.

Check in /dev if the devices installed successfully:
```shell
$ ls -l /dev/spi*
crw-rw---- 1 root spi 153, 0 Aug 14 22:22 /dev/spidev0.0
crw-rw---- 1 root spi 153, 1 Aug 14 22:22 /dev/spidev0.1
```

Then, wire your display(s) in using the following diagram (for a Pi < 2 the wiring is the same, there are just fewer pins.)

![max7219 pi3 wiring diagram](https://i.imgur.com/N8GwqnK.png "Wiring the MAX7219 to the Raspberry Pi")

This diagram shows a single matrix (of 8 displays). You can daisy-chain as many of these as your PI can handle, and set `controllerCount` (below) to match that unit. For the example above, you would set `controllerCount = 1`.

### Usage

See examples folder for concrete examples, but:

```js
'use strict'

const Max7219 = require('..')
const m = new Max7219({ device: '/dev/spidev0.0', controllerCount: 4, flip: 'vertical' })

async function init () {
  const letters = 'HIYA'.split('')
  letters.forEach((chr, i) => {
    await m.reset(i)
    await m.letter(i, chr)
  })
}

init()
```

### Custom characters

You can generate custom characters using the [Custom character generator](https://antony.github.io/MAX7219.js/).

Take the array output from this generator and feed it to the `set()` method:

```js
'use strict'

const Max7219 = require('..')
const m = new Max7219({ device: '/dev/spidev0.0', controllerCount: 4, flip: 'vertical' })

const myMatrix = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,0],
  [0,0,1,0,0,0,1,0],
  [0,0,0,0,0,0,1,0],
  [0,0,0,0,0,0,1,0],
  [0,0,1,0,0,0,1,0],
  [0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,0]
]

async function init () {
  await m.reset(0)
  await m.set(0, myMatrix)
}

init()
```

### Config

| Property               | default             | options                          | meaning                                                      |
| ---------------------- | ------------------- | -------------------------------- | ------------------------------------------------------------ |
| device                 | -                   | /dev/spidev0.0                   | spi device path                                              |
| controllerCount        | 1                   | 1-8                              | how many individual units you have in your array (1-8)       |
| flip                   | none                | none, vertical, horizontal, both | In case you want to flip the array if they are soldered on upside down / back to front (or both) |
| rotate                 | 0                   | 0,90,180,270                     | Support for rotation of display data in 90 degree increments. |
| transform              | default 'transform' | custom function                  | Support for a user-defined matrix transform function.  **See /lib/transformations.js** for the default implementation. |
| reverseDisplayOrdering | false               | boolean                          | Under normal circumstances, the first Max7219 in a chain, the one connected directly to a controller, is identified as 'Physical' display #0 and the last max7219 in the chain ,typically the one on the opposite end of a 4 chip module, is considered 'Physical' display #3.   By default, this library addresses these displays in the reversed order meaning the last display in the chain is 'Logical' display #0 and the first display in the chain is Logical display #3 (assuming 4 displays are being used).  There may be cases when a rotation value of 180 (or just a vertical flip) or 270 is used where this ordering needs to be reversed.   This option will force this library to address the displays using their 'Physical' position instead of the 'Logical' position.  **See examples/text2.js** |

### Scrolling

To scroll a string of text on the display, you can use `.scroll()`.

```js
await m.scroll('HELLO WORLD')
```

Scroll has the following options:

| Option          | default | type    | meaning                                                      |
| --------------- | ------- | ------- | ------------------------------------------------------------ |
| loop            | true    | boolean | loop scrolling text endlesssly                               |
| speed           | 300     | integer | milliseconds delay between next movement                     |
| scrollIn        | false   | boolean | If true, will prepend the scroll text with one or more spaces where a single space represents each controller.   Behavior is such that this will cause the text will scroll in from a blank display. |
| scrollIncrement | 1       | integer | Specifies the number of pixels/columns that will be scrolled each time.  This is useful if you don't want to scroll 1 pixel at a time.  The maximum value is equal to 8 * the controllerCount (4 controllers -> 8 * 4). |

### Credits

Credits to me, but also based off an [original codebase](https://www.npmjs.com/package/max7219) by Victor Porov
