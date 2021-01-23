'use strict'
function vertical (matrix) {
  return matrix.slice().reverse()
}

function horizontal (matrix) {
  return matrix.map(r => r.reverse() )
}

function transpose(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < i; j++) {
      let temp = matrix[i][j]
      matrix[i][j] = matrix[j][i]
      matrix[j][i] = temp
    }
  }
  return matrix;
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
  "0":   m => transpose(m.map(r => r.slice()).reverse()),
  "90":  m => m,
  "180": m => transpose(m.map(r => r.slice().reverse())),
  "270": m => m.map(r => r.slice().reverse()).reverse()
}

function flip (matrix, direction) {
  const flipFunction = flipFunctions[direction];
  
  if (flipFunction) {
    return flipFunction(matrix)
  }
  
  throw new Error("You may only flip by 'none', 'horizontal', 'vertical', or 'both'")
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