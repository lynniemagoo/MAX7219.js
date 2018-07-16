'use strict'

 exports.flip = function (matrix, direction) {
  if (!['none', 'horizontal', 'vertical', 'both'].includes(direction)) {
    throw new Error('You can only rotate by 0, 90, 180, or 270 degrees')
  }

  function vertical (matrix) {
    return matrix.reverse()
  }

  function horizontal (matrix) {
    return matrix.map(r => r.reverse() )
  }

  if ( direction === 'none' ) { return matrix }
  if ( direction === 'vertical' ) { return vertical(matrix) }
  if ( direction === 'horizontal' ) { return horizontal(matrix) }
  if ( direction === 'both' ) { return vertical(horizontal(matrix)) }
}

exports.rotate = function (matrix, degrees) {
  if (![0, 90, 180, 270].includes(degrees)) {
    throw new Error('You can only rotate by 0, 90, 180, or 270 degrees')
  }

 const rotated = matrix.map(r => r.slice()).reverse()
 
 for (let i = 0; i < rotated.length; i++) {
   for (let j = 0; j < i; j++) {
     let temp = rotated[i][j]
     rotated[i][j] = rotated[j][i]
     rotated[j][i] = temp
   }
 }

 return rotated
}