"""Exercise the real match analysis locally or against its public deployment."""
import functools
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'output/qa'
QA.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'examples/portfolio')))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(**({'channel':'chrome'} if os.name=='nt' else {}))
        page=browser.new_page(viewport={'width':1280,'height':1000},reduced_motion='reduce')
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(os.environ.get('AUDIT_URL',f'http://127.0.0.1:{server.server_port}'),wait_until='networkidle')
        page.wait_for_function('window.__deadlock?.ready')
        assert page.evaluate('__deadlock.records')==11423
        before=page.evaluate('__deadlock.result.n')
        page.locator('#threshold').fill('5000');page.locator('#threshold').dispatch_event('input')
        assert page.evaluate('__deadlock.result.n')<before
        page.locator('#metric').select_option('player_damage')
        assert 'End-of-match' in page.locator('#answer').inner_text()
        page.locator('#cohort summary').click()
        page.locator('#dots button').first.click()
        assert 'match ' in page.locator('#match-detail').inner_text()
        with page.expect_download() as dl:page.locator('#download').click()
        assert dl.value.suggested_filename=='deadlock-cohort.csv'
        page.locator('#cohort summary').click()
        page.locator('#metric').select_option('nw_600')
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(ROOT/'examples/portfolio/preview.png'))
        page.screenshot(path=str(QA/'desktop.png'),full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'mobile overflow'
        page.screenshot(path=str(QA/'mobile.png'),full_page=True)
        assert page.locator('.bin:visible').count()==4
        page.locator('.sparse-bins summary').click()
        assert page.locator('.bin:visible').count()==12
        page.screenshot(path=str(QA/'small-cohorts.png'),full_page=True)
        page.locator('.sparse-bins summary').click()
        circle=page.locator('.bin circle').first.bounding_box()
        assert abs(circle['width']-circle['height'])<1, 'confidence marks stretched'
        page.locator('#metric').focus();page.keyboard.press('Tab')
        assert page.locator('#threshold').evaluate('(el)=>getComputedStyle(el).outlineWidth')=='2px'
        page.locator('#metric').select_option('net_worth')
        page.locator('#duration').select_option('0,25')
        page.locator('#threshold').fill('100000');page.locator('#threshold').dispatch_event('input')
        assert page.evaluate('__deadlock.result.n')==0
        assert 'No matches' in page.locator('#answer').inner_text()
        assert page.locator('#download').is_disabled()
        page.screenshot(path=str(QA/'empty-cohort.png'),full_page=True)
        page.route('**/data/matches.json',lambda route:route.abort())
        page.reload(wait_until='networkidle')
        assert 'could not load' in page.locator('#scope').inner_text()
        assert page.locator('#metric').is_disabled()
        page.screenshot(path=str(QA/'archive-error.png'),full_page=True)
        assert not errors,errors
        print('PASS: real census, checkpoint filter, metric switch, match inspection, export and mobile')
        browser.close()
finally: server.shutdown()
