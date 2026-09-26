from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=['--enable-unsafe-webgpu'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:4173',wait_until='networkidle')
    page.wait_for_function("window.formaDebug?.().ready && document.querySelector('#loading').hidden",timeout=60000)
    page.screenshot(path=str(root/'test-results/release-desktop.png'))
    result=page.evaluate('window.formaDebug()')
    assert len(result['state']['instances'])==1 and result['backend'] in ('WebGPU','WebGL')
    assert not errors,errors
    (root/'test-results/production.json').write_text(json.dumps({'backend':result['backend'],'errors':errors,'ready':result['ready'],'drawCalls':result['drawCalls'],'triangles':result['triangles']},indent=2),encoding='utf-8')
    browser.close()
