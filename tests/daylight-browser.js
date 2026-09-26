async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5173/?project=customer-garden&webgl=1');
 await page.waitForFunction(()=>window.formaDebug?.().ready&&document.querySelector('#loading').hidden,{timeout:90000});
 const set=async(id,value)=>{await page.locator(id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);await page.waitForTimeout(250);};
 await set('#sun-time','13');await set('#cloud-cover','10');await set('#sun-direction','0');await page.locator('#lamp-mode').selectOption('auto');await page.locator('#light-quality').selectOption('balanced');
 const day=await page.evaluate(()=>formaDebug().lighting);if(day.sunIntensity<1)throw Error('No daylight');
 await page.screenshot({path:'test-results/realism-day.png'});
 await page.getByRole('button',{name:'Widok z poziomu oczu',exact:true}).click();await page.waitForTimeout(300);await page.screenshot({path:'test-results/realism-sky.png'});await page.getByRole('button',{name:'Ogród',exact:true}).click();
 await set('#sun-direction','120');const rotated=await page.evaluate(()=>formaDebug().lighting);if(rotated.sunPosition[0]===day.sunPosition[0])throw Error('Sun direction not changing');
 await set('#cloud-cover','100');const cloudy=await page.evaluate(()=>formaDebug().lighting);if(cloudy.sunIntensity>=day.sunIntensity)throw Error('Clouds do not dim sun');
 await page.screenshot({path:'test-results/realism-cloudy.png'});
 await set('#sun-time','19.25');await set('#cloud-cover','20');await page.locator('#lamp-mode').selectOption('on');
 await page.screenshot({path:'test-results/realism-evening.png'});
 if(await page.locator('#time-label').innerText()!=='19:15')throw Error('Time formatting');
 await page.locator('#light-quality').selectOption('eco');await page.reload();await page.waitForFunction(()=>window.formaDebug?.().ready&&document.querySelector('#loading').hidden);
 const persisted=await page.evaluate(()=>formaDebug().lighting);if(persisted.hour!==19.25||persisted.lamps!=='on'||persisted.quality!=='eco')throw Error('Atmosphere not persisted');
 await set('#sun-time','21');const night=await page.evaluate(()=>formaDebug().lighting);if(night.sunIntensity!==0||night.lampLevel<=0)throw Error('Evening lights failed');
 await page.screenshot({path:'test-results/realism-night.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('#mobile-properties').click();await page.locator('#cloud-cover').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/realism-mobile.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 return {status:'PASS',day,cloudy,night,objects:await page.evaluate(()=>formaDebug().state.instances.length),errors};
}
