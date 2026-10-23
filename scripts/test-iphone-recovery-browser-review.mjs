import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base=process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'QA must use localhost')
const evidence=resolve(process.env.IPHONE_RECOVERY_EVIDENCE || '.cache/iphone-recovery-qa')
mkdirSync(evidence,{recursive:true})
const results=[]
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,args:['--disable-background-networking','--disable-quic','--dns-prefetch-disable']})
const key='master-prime:iphone-purchase-tracking:v1'
const ready=page=>page.evaluate(()=>{const q=window.fbq??function(...args){q.callMethod(...args)};q.callMethod=(...args)=>window.__accepted.push(args);for(const a of q.queue??[])q.callMethod(...a);q.queue=[];window.fbq=q})
try {
for(const scenario of ['04','04b','05','05b']) {
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'})
 const blocked=[]
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===new URL(base).origin&&route.request().method()==='GET')return route.continue();blocked.push(u.origin+u.pathname);return route.fulfill({status:200,contentType:'application/javascript',body:''})})
 if(context.routeWebSocket)await context.routeWebSocket('**/*',ws=>ws.close())
 await context.addInitScript(()=>{window.__accepted=[];window.__opens=[];window.open=(...args)=>{window.__opens.push(args);return null};Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true})})
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(base+'/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed',{waitUntil:'networkidle'})
 await page.locator('.iphone-color').filter({hasText:'Laranja'}).click()
 await page.locator('.quote-next').click()
 await page.getByRole('button',{name:'À vista',exact:true}).click()
 await page.getByRole('button',{name:'Pix',exact:true}).click()
 await page.locator('.quote-next').click()
 await page.getByRole('heading',{level:2,name:'Confira sua consulta.'}).waitFor()
 if(scenario==='05b')await page.evaluate(()=>{delete window.fbq})
 await page.locator('.quote-next').click()
 const before=await page.evaluate(key=>({state:JSON.parse(sessionStorage.getItem(key)),opens:window.__opens,calls:window.__accepted}),key)
 assert.equal(before.opens.length,1,'WhatsApp intercepted immediately before SDK release')
 assert.equal(before.calls.length,0)
 assert(before.state.pixelPending.whatsapp)
 const id=before.state.attemptId+'_whatsapp'
 if(scenario==='04b')await page.reload({waitUntil:'networkidle'})
 if(scenario!=='05'){
  await ready(page)
  await page.waitForFunction(()=>window.__accepted.some(a=>a[2]==='IPhonePurchaseQuoteWhatsAppClick'))
  await page.locator('.quote-next').click()
  const calls=await page.evaluate(()=>window.__accepted.filter(a=>a[2]==='IPhonePurchaseQuoteWhatsAppClick'))
  assert.equal(calls.length,1);assert.equal(calls[0][4].eventID,id)
 }else{await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.__accepted.length),0)}
 assert.deepEqual(errors,[])
 results.push({scenario,passed:true,opensBeforeSDK:before.opens.length,eventID:id,externalRequestsFulfilledLocally:blocked,errors})
 console.log('PASS browser',scenario)
 await context.close()
}
} finally {await browser.close();writeFileSync(resolve(evidence,'browser-recovery-revisada.json'),JSON.stringify(results,null,2))}
