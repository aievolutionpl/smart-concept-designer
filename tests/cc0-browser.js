async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:900});await page.goto('http://127.0.0.1:5173/tests/cc0-scene.html?webgl=1');
 await page.waitForFunction(()=>window.fixtureReady);
 await page.evaluate(()=>fixture.add(1));await page.waitForTimeout(500);const single=await page.evaluate(()=>fixture.metrics());
 await page.evaluate(()=>{fixture.engine.remove('fern-0');return fixture.add(36);});await page.waitForTimeout(800);
 const repeated=await page.evaluate(()=>fixture.metrics());
 if(repeated.instances!==36||repeated.calls>single.calls+2)throw Error('Instancing draw calls grew with plant count');
 const timing=await page.evaluate(async()=>{const samples=[];let last=performance.now();for(let i=0;i<90;i++)await new Promise(resolve=>requestAnimationFrame(now=>{samples.push(now-last);last=now;resolve();}));samples.sort((a,b)=>a-b);return {medianMs:samples[45],p95Ms:samples[85],devicePixelRatio,renderer:fixture.engine.renderer.backend.isWebGPUBackend?'WebGPU':'WebGL'};});
 await page.screenshot({path:'test-results/cc0-instancing.png'});
 await page.goto('http://127.0.0.1:5173/?project=customer-garden');await page.waitForFunction(()=>window.formaDebug?.().ready&&document.querySelector('#loading').hidden);
 await page.locator('#project-file').setInputFiles('../assets/customer-garden/Customer_Garden.forma.json');await page.waitForFunction(()=>formaDebug().state.instances.length===9);
 if(await page.locator('#toggle-library').getAttribute('aria-expanded')==='false')await page.locator('#toggle-library').click();
 await page.locator('#asset-search').fill('Paprocie');const before=await page.evaluate(()=>formaDebug().state.instances.length);
 await page.getByRole('button',{name:'Dodaj Paprocie leśne',exact:true}).click();await page.waitForFunction(n=>formaDebug().state.instances.length===n+1,before);
 if((await page.evaluate(()=>formaDebug().vegetation.instances))<1)throw Error('Library vegetation not instanced');
 await page.getByRole('button',{name:'Powiel',exact:true}).click();await page.waitForFunction(n=>formaDebug().state.instances.length===n+2,before);
 await page.getByRole('tab',{name:'Materiały',exact:true}).click();await page.getByRole('button',{name:'Zastosuj',exact:true}).click();
 await page.waitForFunction(()=>formaDebug().state.surfaces?.patio==='acg-PavingStones092');
 await page.screenshot({path:'test-results/cc0-material-panel.png'});
 await page.reload();await page.waitForFunction(()=>formaDebug?.().ready&&document.querySelector('#loading').hidden);
 if((await page.evaluate(()=>formaDebug().state.surfaces.patio))!=='acg-PavingStones092')throw Error('Material persistence failed');
 const exportEvent=page.waitForEvent('download',{timeout:90000});await page.locator('#export-glb').click();const exported=await exportEvent;await exported.saveAs('test-results/cc0-scene.glb');
 await page.setViewportSize({width:390,height:844});await page.locator('#mobile-assets').click();await page.getByRole('tab',{name:'Materiały',exact:true}).click();
 await page.screenshot({path:'test-results/cc0-mobile.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 return {status:'PASS',single,repeated,timing,errors};
}
