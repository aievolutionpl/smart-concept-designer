async(page)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:5173/?project=customer-garden');
 await page.waitForFunction(()=>window.formaDebug?.().ready&&document.querySelector('#loading').hidden,{timeout:60000});
 await page.waitForTimeout(1800);
 await page.screenshot({path:'test-results/customer-garden-first.png'});
 return {errors,debug:await page.evaluate(()=>window.formaDebug())};
}
