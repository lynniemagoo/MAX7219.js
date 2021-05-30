const Max7219 = require('..')
const controllerCount = 4;
const m = new Max7219({ font:"cp437", device: '/dev/spidev0.0', reverseDisplayOrdering:true, controllerCount: controllerCount, flip: 'none', rotate:180})

async function init () {
  await m.reset();
  await m.setIntensity(0);

  //let matrix = [[0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0],[0,1,1,0,0,1,0,0],[0,0,0,1,0,1,0,0],[0,0,0,1,0,1,0,0],[0,1,1,0,0,1,0,0],[0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,0]]
  
  let matrix = [[0,0,0,0,0,1,0,0],[0,0,0,0,1,1,0,0],[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0],[0,0,0,0,1,1,0,0],[0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0]]

  await m.resetAll()
  await m.set(0,matrix);
  if (controllerCount > 1) await m.set(1,matrix);
  if (controllerCount > 2) await m.set(2,matrix);
  if (controllerCount > 3) await m.set(3,matrix);

  await new Promise(resolve => setTimeout(resolve, 5000))
  
  
  await m.letter(0, 'J')
  if (controllerCount > 1) await m.letter(1, 'o')
  if (controllerCount > 2) await m.letter(2, 'y')
  if (controllerCount > 3) await m.letter(3, '!')
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  await m.clearAll();
  await new Promise(resolve => setTimeout(resolve, 1000))
  while(true) {
     //await m.resetAll();
     await m.scroll("Joy To The World!",{scrollIn:true,loop:false,speed:40,scrollIncrement:1,glyphRotate:0,glyphFlip:'none'});
     for (let i=0;i<controllerCount;i++) {
         await m.clearAll();
         if (i> 0) await new Promise(resolve => setTimeout(resolve, 1000))
         await m.display("Joy!",i);
         await new Promise(resolve => setTimeout(resolve, 1000))
     }
     await m.clearAll();
     await new Promise(resolve => setTimeout(resolve, 1000))
     await m.set(0,matrix);
     if (controllerCount > 1) await m.set(1,matrix);
     if (controllerCount > 2) await m.set(2,matrix);
     if (controllerCount > 3) await m.set(3,matrix);
     await new Promise(resolve => setTimeout(resolve, 5000))
     await m.clearAll();
     await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

init();