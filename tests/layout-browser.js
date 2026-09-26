async(page)=>{
 await page.goto('http://127.0.0.1:5173/?project=customer-garden&webgl=1');await page.waitForFunction(()=>formaDebug?.().ready&&document.querySelector('#loading').hidden);
 const result=await page.evaluate(async()=>{
  const {buildCustomerGarden,CUSTOMER,CUSTOMER_BOUNDARY,insidePolygon,customerPlaceable}=await import('/src/customer-garden.js');const THREE=await import('/node_modules/three/build/three.webgpu.js');
  const model=buildCustomerGarden();model.root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model.layers.planting);
  const checks={tankInside:CUSTOMER.tank.every(p=>insidePolygon(...p,CUSTOMER_BOUNDARY)),tankBlocked:!customerPlaceable(-3.55,-7.4,.25,.25),roomBlocked:!customerPlaceable(4,-8,.2,.2),shrubsHeight:box.max.y,room:CUSTOMER.buildings[2]};
  if(!checks.tankInside||!checks.tankBlocked||!checks.roomBlocked||checks.shrubsHeight>.9)throw Error(JSON.stringify(checks));return checks;
 });return {status:'PASS',...result};
}
