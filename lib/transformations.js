'use strict'
// Algorithm to reverse bits in an integer.  If integer is > 255 (0xff) then pass additional byteCount parameter.  Supports up to 4 bytes (32 bits).
// Adapted from 2002 Hacker's Delight by Henry S. Warren, Jr. Chapter 7
function reverseBits(x, byteCount = 1) {
  x = (x & 0x55555555)  <<   1 | (x & 0xAAAAAAAA) >>  1;
  x = (x & 0x33333333)  <<   2 | (x & 0xCCCCCCCC) >>  2;
  x = (x & 0x0F0F0F0F)  <<   4 | (x & 0xF0F0F0F0) >>  4;
  if (byteCount > 1) x = (x & 0x00FF00FF)  <<   8 | (x & 0xFF00FF00) >>  8;
  if (byteCount > 2) x = (x & 0x0000FFFF)  <<  16 | (x & 0xFFFF0000) >> 16;
  return x >>> 0;
}

// Algorithm to transpose an 8 byte array (X and Y axis)
// Adapted from 2002 Hacker's Delight by Henry S. Warren, Jr. Chapter 7
function transpose8(byteArray) {
  let x, y, t;
  // Load the 8 byte array and pack it into 32 bit integers x and y.
  x = (byteArray[0] << 24) | (byteArray[1] << 16) | (byteArray[2] << 8) | byteArray[3];
  y = (byteArray[4] << 24) | (byteArray[5] << 16) | (byteArray[6] << 8) | byteArray[7];
  t = (x ^ (x >> 7)) & 0x00AA00AA; 
  x = x ^ t ^ (t << 7);
  t = (y ^ (y >> 7)) & 0x00AA00AA; 
  y = y ^ t ^ (t << 7);
  t = (x ^ (x >> 14)) & 0x0000CCCC;
  x = x ^ t ^ (t << 14);
  t = (y ^ (y >> 14)) & 0x0000CCCC; 
  y = y ^ t ^ (t << 14);
  t = (x & 0xF0F0F0F0) | ((y >> 4) & 0x0F0F0F0F);
  y = ((x << 4) & 0xF0F0F0F0) | (y & 0x0F0F0F0F);

  y = y >>> 0;
  x = t >>> 0;
  return [(x >> 24) & 0xff, (x >> 16) & 0xff ,(x >> 8) & 0xff, x & 0xff,
          (y >> 24) & 0xff, (y >> 16) & 0xff, (y >> 8) & 0xff, y & 0xff];
}

function vertical (matrix) {
  return matrix.slice().reverse()
}

function horizontal (matrix) {
  return matrix.map(element => reverseBits(element))
}

const flipFunctions = {
  none:       m => m,
  vertical:   m => vertical(m),
  horizontal: m => horizontal(m),
  both:       m => vertical(horizontal(m))
}

/*********************************************************************************************
 * Matrix Rotation algorithm supports 0,90,180,270 degree rotation.
 * Notes about what has to be done for each degree value are below.
 *
 * 0 degrees - Rotate additional 270 degrees or -90 degrees such that we are at 0.
 * 90 degrees - Original matrices are encoded to be at 90 degrees by default so do nothing.
 * 180 degrees - Rotate additional 90 degrees by reversing and transposing.
 * 270 degrees - Rotate additional 180 degrees by simply reversing rows and columns in place. 
 *               Note this us identical to flip("both") except for a deep copy.
 *********************************************************************************************/
const rotateFunctions = {
  "0": m => transpose8(m.map(element => reverseBits(element))),
  "90":  m => m,
  "180":   m => transpose8(m.slice().reverse()),
  "270": m => m.map(element => reverseBits(element)).reverse()
}

function flip (matrix, direction) {
  const flipFunction = flipFunctions[direction];
  
  if (flipFunction) {
    return flipFunction(matrix)
  }
  
  throw new Error("You may only flip by 'none', 'horizontal', 'vertical', or 'both'.")
}

function rotate(matrix, degrees) {
  const rotateFunction = rotateFunctions[degrees];

  if (rotateFunction) {
    return rotateFunction(matrix)
  }

  throw new Error('You may only rotate by 0, 90, 180, or 270 degrees.')
}

exports.transform = function (matrix, degrees, direction) {
  let result = matrix;
  result = rotate(result,degrees)
  result = flip(result, direction)
  return result;
}