async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:5173/?project=customer-garden');
 await page.waitForFunction(()=>window.formaDebug?.().ready);
 const left=page.locator('#toggle-library'),right=page.locator('#toggle-inspector'),focus=page.locator('#focus-workspace');
 await left.click();
 if(await page.locator('#library-panel').isVisible())throw Error('Library remains visible');
 await right.click();
 if(await page.locator('#inspector').isVisible())throw Error('Inspector remains visible');
 await page.reload();await page.waitForFunction(()=>window.formaDebug?.().ready);
 if(await page.locator('#library-panel').isVisible())throw Error('Preference not persisted');
 await left.click();await right.click();await focus.click();
 if(await page.locator('#library-panel').isVisible()||await page.locator('.stage-heading').isVisible())throw Error('Focus mode failed');
 await page.screenshot({path:'test-results/workspace-focus-desktop.png'});
 await page.keyboard.press('Escape');
 if(!await page.locator('#library-panel').isVisible())throw Error('Escape did not restore panels');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#mobile-assets').click();
 if(await page.locator('#library-panel').evaluate(p=>p.inert))throw Error('Mobile panel inert');
 await page.locator('#library-panel [data-close]').click();
 await focus.click();await page.screenshot({path:'test-results/workspace-focus-mobile.png'});
 const box=await page.locator('.tool-dock').boundingBox();
 if(box.x<0||box.x+box.width>391)throw Error('Toolbar overflow');
 await focus.click();await left.click();
 if(!await page.locator('#library-panel').isVisible())throw Error('Mobile reopen failed');
 if(errors.length)throw Error(errors.join('\n'));
 return {status:'PASS',checks:['independent panel toggles','persisted preferences','focus and Escape restore','mobile reopen','390px toolbar fits'],errors};
}
