async(page)=>{
 await page.setViewportSize({width:640,height:440});
 for(const id of ['dining-table','garden-chair','coffee-table','planter']){
  await page.goto('http://127.0.0.1:5173/tests/furniture-preview.html?id='+id);
  await page.waitForFunction(()=>window.previewReady);
  await page.screenshot({path:'test-results/'+id+'.png'});
 }
 return {status:'four previews captured'};
}
