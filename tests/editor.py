from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results'
OUT.mkdir(exist_ok=True)
report={'checks':[]}
def ok(name):
    report['checks'].append(name)
    print('PASS',name,flush=True)

with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=['--enable-unsafe-webgpu'])
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:5173',wait_until='networkidle')
    page.wait_for_function("window.formaDebug?.().ready && document.querySelector('#loading').hidden",timeout=60000)
    assert page.evaluate('window.formaDebug().state.instances.length')==1
    report['primary_backend']=page.locator('#render-backend').inner_text()
    ok('Initial Cube Plus model loads')
    page.get_by_role('button',name='Dodaj Ławka ogrodowa',exact=True).click()
    page.wait_for_function('window.formaDebug().state.instances.length===2')
    ok('Add asset through visible UI')
    page.get_by_label('Pozycja X',exact=True).fill('3.5')
    page.get_by_label('Pozycja X',exact=True).press('Tab')
    page.wait_for_function('window.formaDebug().state.instances[1].x===3.5')
    page.get_by_label('Obrót w stopniach',exact=True).fill('45')
    page.get_by_label('Obrót w stopniach',exact=True).press('Tab')
    page.wait_for_function('window.formaDebug().state.instances[1].rotation===45')
    page.get_by_label('Skala obiektu',exact=True).fill('1.2')
    page.get_by_label('Skala obiektu',exact=True).press('Tab')
    page.wait_for_function('window.formaDebug().state.instances[1].scale===1.2')
    ok('Position, rotation and scale update model state')
    page.get_by_role('button',name='Cofnij',exact=True).click()
    page.wait_for_function('window.formaDebug().state.instances[1].scale===1')
    page.get_by_role('button',name='Ponów',exact=True).click()
    page.wait_for_function('window.formaDebug().state.instances[1].scale===1.2')
    ok('Undo and redo restore transformations')
    page.get_by_role('button',name='Powiel',exact=True).click()
    page.wait_for_function('window.formaDebug().state.instances.length===3')
    page.get_by_role('button',name='Usuń obiekt',exact=True).click()
    page.wait_for_function('window.formaDebug().state.instances.length===2')
    ok('Duplicate and delete')
    page.get_by_role('button',name='Środowisko Studio',exact=True).click()
    page.wait_for_function("window.formaDebug().state.environment==='studio'")
    page.get_by_role('button',name='Środowisko Ogród',exact=True).click()
    page.get_by_role('switch',name='Siatka pomocnicza',exact=True).check()
    assert page.evaluate('window.formaDebug().state.grid')
    page.get_by_role('button',name='Z góry 2D',exact=True).click()
    page.get_by_role('button',name='Perspektywa',exact=True).click()
    ok('Environment, grid and camera controls')
    page.locator('#asset-file').set_input_files(str(ROOT/'public/models/bench.glb'))
    page.wait_for_function("window.formaDebug().assets.some(a=>a.name==='bench' && a.id.startsWith('custom-'))")
    page.get_by_role('button',name='Dodaj bench',exact=True).click()
    page.wait_for_function('window.formaDebug().state.instances.length===3')
    ok('Import local GLB and add to scene')
    with page.expect_download() as pending:
        page.get_by_role('button',name='Zapisz projekt',exact=True).click()
    path=OUT/'roundtrip.forma.json'
    pending.value.save_as(str(path))
    project=json.loads(path.read_text(encoding='utf-8'))
    assert len(project['customAssets'])==1 and len(project['instances'])==3
    page.get_by_role('button',name='Usuń obiekt',exact=True).click()
    page.wait_for_function('window.formaDebug().state.instances.length===2')
    page.locator('#project-file').set_input_files(str(path))
    page.wait_for_function('window.formaDebug().state.instances.length===3')
    ok('Project export/import includes custom model data')
    page.reload(wait_until='networkidle')
    page.wait_for_function("window.formaDebug?.().ready && document.querySelector('#loading').hidden")
    assert page.evaluate('window.formaDebug().state.instances.length')==3
    ok('Reload restores layout and IndexedDB models')
    page.get_by_role('switch',name='Siatka pomocnicza',exact=True).uncheck()
    page.screenshot(path=str(OUT/'desktop.png'))
    with page.expect_download() as pending:
        page.get_by_role('button',name='Zapisz obraz sceny',exact=True).click()
    pending.value.save_as(str(OUT/'scene.png'))
    assert (OUT/'scene.png').stat().st_size>10000
    ok('Scene PNG export')
    page.goto('http://127.0.0.1:5173/?webgl=1',wait_until='networkidle')
    page.wait_for_function("window.formaDebug?.().ready && document.querySelector('#loading').hidden",timeout=60000)
    assert page.locator('#render-backend').inner_text()=='WebGL'
    ok('Forced WebGL fallback renders scene')
    page.screenshot(path=str(OUT/'webgl.png'))
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    mobile.on('pageerror',lambda e:errors.append(str(e)))
    mobile.goto('http://127.0.0.1:5173',wait_until='networkidle')
    mobile.wait_for_function("window.formaDebug?.().ready && document.querySelector('#loading').hidden",timeout=60000)
    assert mobile.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
    mobile.screenshot(path=str(OUT/'mobile.png'))
    mobile.locator('#mobile-assets').click()
    expect(mobile.get_by_role('button',name='Dodaj Cube Plus',exact=True)).to_be_visible()
    mobile.get_by_role('button',name='Dodaj Ławka ogrodowa',exact=True).click()
    mobile.wait_for_function('window.formaDebug().state.instances.length===2')
    mobile.locator('#mobile-properties').click()
    expect(mobile.get_by_label('Pozycja X',exact=True)).to_be_visible()
    mobile.get_by_label('Pozycja X',exact=True).fill('4')
    mobile.get_by_label('Pozycja X',exact=True).press('Tab')
    mobile.wait_for_function('window.formaDebug().state.instances[1].x===4')
    mobile.screenshot(path=str(OUT/'mobile-properties.png'))
    ok('390px layout and mobile editing')
    report['errors']=errors
    assert not errors,errors
    ok('No uncaught application errors')
    browser.close()
    (OUT/'acceptance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
