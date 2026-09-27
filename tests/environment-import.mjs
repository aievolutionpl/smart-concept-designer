import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_URL||'http://127.0.0.1:5173/';
const ready=()=>page.waitForFunction(()=>window.formaDebug?.().ready&&document.querySelector('#loading').hidden,null,{timeout:60000});
const state=()=>page.evaluate(()=>window.formaDebug().state);
try{
 await page.goto(base+'?project=customer-garden-premium');await ready();const before=await state();
 await page.locator('#import-environment').click();await page.locator('#environment-file').setInputFiles({name:'bad.glb',mimeType:'model/gltf-binary',buffer:Buffer.from('broken')});await page.locator('#environment-import-submit').click();await page.waitForFunction(()=>document.querySelector('#environment-import-error').textContent.length>0);assert.equal((await state()).instances.length,before.instances.length);
 await page.locator('#environment-file').setInputFiles('public/models/premium/premium-sectional.glb');await page.locator('#environment-import-submit').click();await page.waitForFunction(()=>!document.querySelector('#environment-import-dialog').open);
 let s=await state();assert.equal(s.environment,'empty');assert.equal(s.instances.length,before.instances.length+1);const imported=s.instances.at(-1);assert(imported.assetId.startsWith('custom-env-'));
 await page.locator('[data-prop=x]').fill('2');await page.locator('[data-prop=x]').press('Tab');assert.equal((await state()).instances.at(-1).x,2);
 await page.locator('[data-prop=rotation]').fill('45');await page.locator('[data-prop=rotation]').press('Tab');
 await page.locator('#undo').click();assert.equal((await state()).instances.at(-1).rotation,0);await page.locator('#redo').click();assert.equal((await state()).instances.at(-1).rotation,45);
 await page.screenshot({path:'test-results/environment-import-desktop.png'});
 const download=page.waitForEvent('download');await page.locator('#save-project').click();const json=JSON.parse(await readFile(await (await download).path(),'utf8'));assert.equal(json.customAssets[0].environment,true);
 await page.reload();await ready();assert.equal((await state()).instances.at(-1).rotation,45);
 const fresh=await browser.newContext();const other=await fresh.newPage();await other.goto(base+'?project=customer-garden-premium');await other.waitForFunction(()=>window.formaDebug?.().ready&&document.querySelector('#loading').hidden);
 await other.locator('#project-file').setInputFiles({name:'environment.forma.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(json))});await other.waitForFunction(()=>window.formaDebug().state.environment==='empty');assert.equal(await other.evaluate(()=>window.formaDebug().state.instances.at(-1).rotation),45);await fresh.close();
 await page.setViewportSize({width:390,height:844});await page.locator('#mobile-assets').click();await page.locator('#import-environment').click();await page.screenshot({path:'test-results/environment-import-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: invalid GLB rejection, import, furniture preservation, transform, undo/redo, persistence, self-contained project roundtrip in fresh browser, mobile.');
}finally{await browser.close();}
