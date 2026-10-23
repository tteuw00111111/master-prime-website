// Regressions for slow external forms, deferred preload and manual reopening.
// Tally, analytics and WhatsApp are intercepted. No real submissions.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cspFor } from './qa/iphone-csp.mjs'
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4194'
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname))
const out=resolve(process.env.IPHONE_POPUP_LOADING_QA_DIR || '.cache/iphone-popup-loading')
await mkdir(out,{recursive:true})
const report={checks:[],errors:[],realExternalAllowed:0}
const html='<!doctype html><html lang="pt-BR"><body style="background:#1a1917;color:white"><label>Nome<input name="nome"></label><label>WhatsApp<input name="whatsapp" type="tel"></label><button>Enviar simulado</button></body></html>'
for (const [name, engine, executablePath] of [['Chromium',chromium,process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE],['WebKit',webkit,process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE]]) {
 const browser=await engine.launch({headless:true,executablePath:executablePath||undefined})
 async function fixture(){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})
  const requests=[], releases=[]
  let allow=false
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url())
   if(url.hostname==='tally.so'){
    requests.push({url:url.href,referer:req.headers().referer||null})
    if(!allow)await new Promise(resolve=>releases.push(resolve))
    try {await route.fulfill({contentType:'text/html',body:html})}catch{/* Superseded iframe during retry. */}
    return
   }
   if(!['localhost','127.0.0.1'].includes(url.hostname))return route.fulfill({contentType:'text/javascript',body:''})
   if(url.pathname==='/src/data/iphone-contact-popup.ts')return route.fulfill({contentType:'text/javascript',body:"export const IPHONE_CONTACT_POPUP={formId:'QAonly7',integrationVerified:true}"})
   if(req.resourceType()!=='document')return route.continue()
   const response=await route.fetch()
   return route.fulfill({response,headers:{...response.headers(),'content-security-policy':cspFor(url.href)}})
  })
  const page=await context.newPage()
  page.on('pageerror',e=>report.errors.push(`${name}: ${e.message}`))
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+100))
  await page.goto(base+'/orcamento/iphone',{waitUntil:'networkidle'})
  await page.locator('.iphone-catalog').waitFor()
  const dialog=page.locator('.iphone-contact-popup')
  const waitRequests=async count=>{for(let i=0;i<100&&requests.length<count;i++)await new Promise(r=>setTimeout(r,20));assert.equal(requests.length,count)}
  const release=()=>{allow=true;for(const r of releases.splice(0))r()}
  const loaded=()=>page.waitForFunction(()=>{const f=document.querySelector('.iphone-contact-popup-frame');return f&&!f.classList.contains('is-loading')})
  const tick=ms=>page.clock.runFor(ms)
  const scroll=()=>page.evaluate(()=>{const r=document.documentElement;window.scrollTo(0,Math.ceil((r.scrollHeight-r.clientHeight)*.21))})
  return{page,context,requests,waitRequests,release,loaded,tick,scroll,dialog}
 }
 try{
  {
   const f=await fixture()
   assert.equal(f.requests.length,0)
   await f.tick(1000);await f.waitRequests(1)
   assert.equal(await f.dialog.evaluate(d=>d.open),false)
   f.release();await f.loaded()
   await f.tick(6000)
   assert.equal(await f.dialog.evaluate(d=>d.open),true)
   assert.equal(await f.page.getByRole('status').filter({hasText:'Carregando formulário'}).count(),0)
   assert.deepEqual(f.requests,[{url:'https://tally.so/embed/QAonly7?origin=site_iphone_popup',referer:null}])
   await f.page.screenshot({path:resolve(out,`${name}-warm.png`)})
   await f.context.close();report.checks.push(`${name}: iframe fetched before automatic trigger and ready at 7s, clean URL/referrer`)
  }
  {
   const f=await fixture();await f.scroll()
   await f.page.locator('dialog[open]').waitFor();await f.waitRequests(1)
   assert(await f.page.getByText('Carregando formulário…',{exact:true}).isVisible())
   await f.page.screenshot({path:resolve(out,`${name}-loading.png`)})
   await f.tick(8000)
   assert(await f.page.getByRole('button',{name:'Tentar novamente',exact:true}).isVisible())
   await f.page.getByRole('button',{name:'Tentar novamente',exact:true}).click()
   await f.waitRequests(2);f.release();await f.loaded()
   assert.equal(await f.page.locator('.iphone-contact-popup-loading').count(),0)
   assert.equal(await f.page.getByRole('link',{name:'Abrir em outra aba'}).getAttribute('href'),'https://tally.so/r/QAonly7?origin=site_iphone_popup')
   assert.equal(await f.page.getByRole('link',{name:'Abrir em outra aba'}).getAttribute('rel'),'noopener noreferrer')
   await f.page.getByRole('button',{name:'Fechar convite de contato'}).click()
   await f.page.getByRole('button',{name:'Quero receber contato da equipe'}).click()
   assert.equal(await f.dialog.evaluate(d=>d.open),true)
   assert.equal(f.requests.length,2,'Reopen reuses the frame')
   await f.page.getByRole('button',{name:'Fechar convite de contato'}).click()
   await f.page.reload({waitUntil:'networkidle'});await f.tick(9000)
   assert.equal(await f.dialog.evaluate(d=>d.open),false)
   assert.equal(f.requests.length,2,'Dismissed session does not preload or reopen automatically')
   await f.page.getByRole('button',{name:'Quero receber contato da equipe'}).click();await f.waitRequests(3);await f.loaded()
   assert.equal(await f.dialog.evaluate(d=>d.open),true)
   await f.page.getByRole('button',{name:'Fechar convite de contato'}).click()
   await f.page.getByRole('link',{name:'Ver opções de iPhone 17 Pro Max lacrado',exact:true}).click()
   await f.page.locator('.quote-form').waitFor()
   await f.page.getByRole('button',{name:'Quero receber contato da equipe'}).click()
   assert.equal(await f.dialog.evaluate(d=>d.open),true)
   assert.equal(f.requests.length,3,'Configurator manual action also reuses the prepared frame')
   await f.context.close();report.checks.push(`${name}: early scroll gives loading status, slow response offers retry, manual reopen in same session/after refresh works without automatic repetition`)
  }
 }finally{await browser.close()}
}
assert.deepEqual(report.errors,[])
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
