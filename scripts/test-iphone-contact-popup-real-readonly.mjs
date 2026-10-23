// Explicit real-form QA: GET-only, no filled fields, no checkbox changes, no submit.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cspFor } from './qa/iphone-csp.mjs'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4193'
const hostName = new URL(base).hostname
const publicSite = hostName === 'master-prime.com' && new URL(base).protocol === 'https:'
assert(publicSite || ['127.0.0.1', 'localhost'].includes(hostName), 'Only local QA or the authorized public site is allowed')
const dir = resolve(process.env.IPHONE_POPUP_REAL_QA_DIR || '.cache/iphone-popup-real-readonly')
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined })
const report = { submissionAttempted: false, fieldsFilled: false, checkboxChanged: false, realTrackingTransportsAllowed: false, checks: [], errors: [], blockedRequests: [] }
const formUrl = 'https://tally.so/embed/4a4Yab?origin=site_iphone_popup'
async function snapshotForm(frame) {
  return frame.evaluate(() => {
    const data = JSON.parse(document.querySelector('#__NEXT_DATA__').textContent)
    const props = data.props.pageProps
    const phone = document.querySelector('input[type=tel]')
    const name = document.querySelector('input[type=text]')
    const checkbox = document.querySelector('input[type=checkbox]')
    const privacy = [...document.querySelectorAll('a')].find(a => a.href === 'https://master-prime.com/politica-de-privacidade')
    const hiddenNames = props.blocks.filter(b => b.type === 'HIDDEN_FIELDS').flatMap(b => b.payload.hiddenFields.map(f => f.name))
    return {
      title: document.title, language: document.documentElement.lang, country: props.country,
      phoneDefaultCountry: props.blocks.find(b => b.type === 'INPUT_PHONE_NUMBER')?.payload.defaultCountryCode,
      nameRequired: name?.required, nameEmpty: name?.value === '',
      phoneRequired: phone?.required, phoneEmpty: phone?.value === '', phonePlaceholder: phone?.placeholder,
      contactRequired: checkbox?.required, contactChecked: checkbox?.checked,
      contactText: checkbox?.closest('label')?.textContent || document.querySelector('fieldset')?.textContent,
      hiddenNames, origin: data.query.origin, privacyHref: privacy?.href,
      background: props.settings.styles.color.background, text: props.settings.styles.color.text,
      accent: props.settings.styles.color.accent, languageSetting: props.settings.language,
      partialSubmissions: props.settings.hasPartialSubmissions, saveForLater: props.settings.saveForLater,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      visibleTitleCount: [...document.querySelectorAll('h1')].filter(e => e.getBoundingClientRect().height > 0).length,
      submitText: document.querySelector('button[type=submit]')?.textContent,
    }
  })
}
function checkFields(state) {
  assert(state.nameRequired && state.nameEmpty)
  assert(state.phoneRequired && state.phoneEmpty)
  assert(state.contactRequired && state.contactChecked === false)
  assert.equal(state.phoneDefaultCountry, 'BR')
  assert(state.hiddenNames.includes('origin'))
  assert.equal(state.origin, 'site_iphone_popup')
  assert.equal(state.privacyHref, 'https://master-prime.com/politica-de-privacidade')
  assert.equal(state.horizontalOverflow, false)
  assert.equal(state.visibleTitleCount, 1)
}
try {
  for (const viewport of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]) {
    for (const mode of ['direct', 'host']) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
      const tallyDocuments = []
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url())
        if (url.hostname === hostName) {
          if (request.method() !== 'GET') return route.abort()
          if (publicSite) return route.continue()
          if (request.resourceType() !== 'document') return route.continue()
          const response = await route.fetch()
          return route.fulfill({ response, headers: {...response.headers(), 'content-security-policy': cspFor(url.href)} })
        }
        const allowed = request.method() === 'GET' && ['tally.so','fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname) && !/analytics|\/track|\/collect/i.test(url.pathname)
        if (!allowed) {
          report.blockedRequests.push({ method: request.method(), host: url.hostname, path: url.pathname })
          return route.abort()
        }
        if (url.hostname === 'tally.so' && url.pathname.startsWith('/embed/')) tallyDocuments.push({ url: url.href, referer: request.headers().referer || null })
        return route.continue()
      })
      const page = await context.newPage()
      page.on('pageerror', error => report.errors.push({ mode, width: viewport.width, message: error.message }))
      let frame = page
      let host = null
      if (mode === 'direct') await page.goto(formUrl, {waitUntil:'networkidle'})
      else {
        const path = viewport.width === 1440 ? '/orcamento/iphone/' : '/orcamento/iphone'
        const response = await page.goto(`${base}${path}`, {waitUntil:'networkidle'})
        const actualCsp = response.headers()['content-security-policy']
        assert.equal(actualCsp, cspFor(path), 'Real response CSP must match route policy; public response is never overridden')
        const before = await page.evaluate(() => JSON.stringify(window.dataLayer))
        if (viewport.width === 320) await page.waitForTimeout(7100)
        else await page.evaluate(() => { const root = document.documentElement; window.scrollTo(0, Math.ceil((root.scrollHeight-root.clientHeight)*.21)) })
        await page.locator('dialog[open]').waitFor()
        await page.frameLocator('.iphone-contact-popup-frame').getByRole('textbox',{name:'Nome',exact:true}).waitFor()
        frame = page.frames().find(f => f.url() === formUrl)
        assert(frame)
        await page.waitForTimeout(300)
        const dialog = page.locator('.iphone-contact-popup')
        host = await dialog.evaluate(node => ({
          open: node.open, width: node.clientWidth, horizontalOverflow: node.scrollWidth > node.clientWidth,
          visibleHeadingHeight: node.querySelector('h2').getBoundingClientRect().height,
          xVisible: (()=>{const r=node.querySelector('button').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})(),
          frameHeight: node.querySelector('iframe').getBoundingClientRect().height,
          focusIsClose: document.activeElement === node.querySelector('button'),
        }))
        assert.equal(host.horizontalOverflow, false); assert.equal(host.xVisible, true); assert.equal(host.focusIsClose, true)
        assert(host.visibleHeadingHeight <= 1)
        assert.deepEqual(tallyDocuments, [{url:formUrl,referer:null}])
        assert.equal(await page.evaluate(() => JSON.stringify(window.dataLayer)), before, 'Opening/reading contact form adds no custom event')
      }
      await frame.getByRole('textbox',{name:'Nome',exact:true}).waitFor()
      const state = await snapshotForm(frame)
      checkFields(state)
      await page.screenshot({path:resolve(dir,`${mode}-${viewport.width}-initial.png`),fullPage:mode==='direct'})
      // Focus-only keyboard QA; never type, check or invoke submit.
      await frame.getByRole('textbox',{name:'Nome',exact:true}).focus()
      await page.keyboard.press('Tab')
      const tabToPhone = await frame.locator('input[type=tel]').evaluate(e => e === document.activeElement)
      assert(tabToPhone)
      let tabToContact = false
      for (let step = 0; step < 3 && !tabToContact; step++) {
        await page.keyboard.press('Tab'); await page.waitForTimeout(50)
        tabToContact = await frame.locator('input[type=checkbox]').evaluate(e => e === document.activeElement)
      }
      assert(tabToContact)
      assert.equal(await frame.locator('input[type=checkbox]').isChecked(),false)
      await frame.locator('button[type=submit]').scrollIntoViewIfNeeded()
      await page.screenshot({path:resolve(dir,`${mode}-${viewport.width}-bottom.png`),fullPage:mode==='direct'})
      let iframeEscapeLimitation = null
      if (mode === 'host') {
        await frame.getByRole('textbox',{name:'Nome',exact:true}).focus()
        await page.keyboard.press('Escape'); await page.waitForTimeout(80)
        iframeEscapeLimitation = await page.locator('dialog').evaluate(node => node.open)
        assert.equal(iframeEscapeLimitation,true)
        const close = page.getByRole('button',{name:'Fechar convite de contato'})
        await close.click()
        assert.equal(await page.locator('dialog').evaluate(node => node.open),false)
        assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY),'hidden')
        await page.locator('.iphone-contact-popup-frame').waitFor({state:'detached'})
        assert.equal(await page.locator('iframe').count(),0)
        if (viewport.width <= 390) {
          await page.reload({waitUntil:'networkidle'})
          await page.evaluate(() => {const r=document.documentElement;window.scrollTo(0,Math.ceil((r.scrollHeight-r.clientHeight)*.3))})
          await page.waitForTimeout(7200)
          assert.equal(await page.locator('dialog').evaluate(node => node.open),false)
          assert.equal(await page.locator('iframe').count(),0)
        }
      }
      report.checks.push({mode,viewport,form:state,host,tabToPhone,tabToContact,iframeEscapeLimitation})
      await context.close()
    }
  }
  assert.deepEqual(report.errors,[])
  await writeFile(resolve(dir,'real-readonly-report.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,submissionAttempted:false,fieldsFilled:false,checkboxChanged:false,blockedMethods:[...new Set(report.blockedRequests.map(r=>r.method))],evidence:dir},null,2))
} finally { await browser.close() }
