async(page)=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5173/?project=customer-garden');
 await page.waitForFunction(()=>formaDebug?.().ready&&document.querySelector('#loading').hidden);
 if(await page.locator('#toggle-library').getAttribute('aria-expanded')==='false')await page.locator('#toggle-library').click();
 await page.locator('[data-filter="cc0"]').click();
 if(await page.locator('#asset-list .asset-card').count()!==3)throw Error('CC0 filter failed');
 await page.waitForFunction(()=>[...document.querySelectorAll('#asset-list img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:'test-results/cc0-library.png'});return {status:'PASS',cards:3};
}
