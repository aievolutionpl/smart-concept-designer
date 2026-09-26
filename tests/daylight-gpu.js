async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:5173/?project=customer-garden');await page.waitForFunction(()=>window.formaDebug?.().ready&&document.querySelector('#loading').hidden);
 const set=async(id,value)=>page.locator(id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await set('#sun-time','17.5');await set('#sun-direction','210');await set('#cloud-cover','45');await page.locator('#light-quality').selectOption('balanced');await page.locator('#lamp-mode').selectOption('auto');
 await page.locator('#focus-workspace').click();await page.getByRole('button',{name:'Widok z poziomu oczu',exact:true}).click();await page.waitForTimeout(800);await page.screenshot({path:'test-results/realism-gpu-eye.png'});
 await page.getByRole('button',{name:'Cała działka',exact:true}).click();await page.waitForTimeout(500);await page.screenshot({path:'test-results/realism-gpu-overview.png'});
 await page.waitForTimeout(2000);
 const result=await page.evaluate(()=>({backend:formaDebug().backend,lighting:formaDebug().lighting,vegetation:formaDebug().vegetation,calls:formaDebug().drawCalls,triangles:formaDebug().triangles}));
 if(errors.length)throw Error(errors.join('\n'));return {status:'PASS',...result,errors};
}
