## Max7219

Display driver for MAX7219 designed for raspberry pi.

Uses Promises and works on recent versions of node ( > 4 ). Tested up to Node v10.

### Installing

```bash
  npm install --save max7219-display
```

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

### Config

| Property        | default | options                          | meaning                                                                                          |
|-----------------|---------|----------------------------------|--------------------------------------------------------------------------------------------------|
| device          | -       | /dev/spidev0.0                   | spi device path                                                                                  |
| controllerCount | 1       | 1-8                              | how many individual units you have in your array (1-8)                                           |
| flip            | none    | none, vertical, horizontal, both | In case you want to flip the array if they are soldered on upside down / back to front (or both) |

### Credits

Credits to me, but also based off an [original codebase](https://www.npmjs.com/package/max7219) by Victor Porov