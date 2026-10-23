// Offline deterministic tests; no browser network, Meta SDK or WhatsApp.
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import vm from 'node:vm'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const output = resolve(process.env.IPHONE_RECOVERY_EVIDENCE || '.cache/iphone-recovery-qa')
mkdirSync(output, { recursive: true })
const revised = process.argv[2] !== 'original'
const root = process.cwd()
const bundle = await build({entryPoints:[root+'/src/utils/iphone-purchase-tracking.ts'],bundle:true,platform:'node',format:'cjs',write:false,tsconfig:root+'/tsconfig.json'})
const selection = {modelId:'iphone-17-pro-max',capacity:256,condition:'sealed',colorId:'orange'}
const storage = () => {const map=new Map(); return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map}}
const key = 'master-prime:iphone-purchase-tracking:v1'
function env(store=storage(),blocked=false) {
 const timers=new Map(),listeners=new Map(),accepted=[]; let sequence=0
 const add=(k,f)=>{if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(f)}
 const remove=(k,f)=>listeners.get(k)?.delete(f)
 const window={location:{search:''},crypto:globalThis.crypto,dataLayer:[],sessionStorage:blocked?{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}:store,
 setTimeout:f=>{timers.set(++sequence,f);return sequence},clearTimeout:id=>timers.delete(id),addEventListener:add,removeEventListener:remove}
 const document={visibilityState:'visible',addEventListener:add,removeEventListener:remove}
 const sandbox={window,document,module:{exports:{}},URLSearchParams,Date,console};vm.runInNewContext(bundle.outputFiles[0].text,sandbox)
 const api=sandbox.module.exports
 const boot=()=>{const f=(...a)=>f.callMethod?f.callMethod(...a):f.queue.push(a);f.queue=[];window.fbq=f;return f}
 const ready=()=>{const f=window.fbq??boot();f.callMethod=(...a)=>accepted.push(a);for(const a of f.queue.splice(0))f.callMethod(...a)}
 const tick=(count=1)=>{for(let i=0;i<count;i++){const current=[...timers.values()];timers.clear();for(const f of current)f()}}
 const tracker=api.createIPhonePurchaseTracker(selection)
 return {window,store,timers,listeners,accepted,boot,ready,tick,tracker,api,fire:k=>{for(const f of listeners.get(k)??[])f()}}
}
const results=[]
function check(name,run){try{run();results.push({name,pass:true});console.log('PASS',name)}catch(e){results.push({name,pass:false,error:e.stack});console.log('FAIL',name,e.message)}}
const track=(e,event='whatsapp',screen='review')=>e.tracker.track(event,selection,screen)
check('04 SDK lento, documento vivo: entrega uma vez ao ficar pronto',()=>{const e=env();e.boot();track(e);assert.equal(e.accepted.length,0);e.ready();e.tick();assert.equal(e.accepted.length,1);track(e);assert.equal(e.accepted.length,1)})
check('04b descarte + retorno: original perde; revisão recupera com mesmo eventID',()=>{const e=env();e.boot();track(e);const id=e.window.dataLayer[0].event_id;e.tracker.dispose?.();const next=env(e.store);next.boot();next.ready();track(next,'viewed',undefined);next.tick();const finals=next.accepted.filter(a=>a[2].endsWith('WhatsAppClick'));assert.equal(finals.length,revised?1:0);if(revised)assert.equal(finals[0][4].eventID,id)})
check('05 SDK bloqueado: zero transporte, retries limitados, estado recuperável só na revisão',()=>{const e=env();e.boot();track(e);e.tick(45);assert.equal(e.accepted.length,0);assert.equal(e.timers.size,0);const state=JSON.parse(e.store.getItem(key));assert.equal(!!state.pixelPending?.whatsapp,revised)})
check('05b fbq ausente: original suprime; revisão recupera e deduplica',()=>{const e=env();track(e);const id=e.window.dataLayer[0].event_id;e.boot();e.ready();track(e);e.tick();assert.equal(e.accepted.length,revised?1:0);if(revised)assert.equal(e.accepted[0][4].eventID,id);assert.equal(e.window.dataLayer.length,1)})
check('mesma vulnerabilidade em Reviewed e StepCompleted',()=>{const e=env();track(e,'step','product');track(e,'step','payment');track(e,'reviewed');e.boot();e.ready();e.tick();assert.equal(e.accepted.length,revised?3:0)})
if(revised){
 check('nova interação depois de 20s renova retry sem loop',()=>{const e=env();e.boot();track(e,'viewed',undefined);e.tick(45);track(e);e.ready();e.tick();assert.equal(e.accepted.length,2);e.tick(50);assert.equal(e.timers.size,0)})
 check('storage indisponível: recuperação em memória, sem promessa após reload',()=>{const e=env(undefined,true);track(e);track(e);e.boot();e.ready();e.tick();assert.equal(e.accepted.length,1);assert.equal(e.window.dataLayer.length,1);e.tracker.dispose()})
 check('dispatcher lança: mantém pendente e mesmo ID ao tentar de novo',()=>{const e=env();const f=e.boot();f.callMethod=()=>{throw Error('SDK')};track(e);const id=e.window.dataLayer[0].event_id;assert(JSON.parse(e.store.getItem(key)).pixelPending.whatsapp);e.ready();e.tick();assert.equal(e.accepted[0][4].eventID,id)})
 check('dispose/remove listeners; resume tolera replay de efeito; pagehide cancela timer',()=>{const e=env();track(e);e.tracker.dispose();assert.equal(e.timers.size,0);assert([...e.listeners.values()].every(s=>s.size===0));e.tracker.resume();assert.equal(e.timers.size,1);e.fire('pagehide');assert.equal(e.timers.size,0);e.ready();e.fire('pageshow');assert.equal(e.accepted.length,1);e.tracker.dispose()})
 check('legado sent sem pending não fabrica conversão retroativa',()=>{const e=env();e.boot();e.ready();track(e);const state=JSON.parse(e.store.getItem(key));delete state.pixelPending;e.store.setItem(key,JSON.stringify(state));e.tracker.dispose();const n=env(e.store);n.boot();n.ready();track(n);n.tick();assert.equal(n.accepted.length,0)})
 check('tentativa expirada descarta pending',()=>{const e=env();track(e);const state=JSON.parse(e.store.getItem(key));state.createdAt-=7200001;e.store.setItem(key,JSON.stringify(state));e.tracker.dispose();const n=env(e.store);assert.notEqual(n.tracker.attemptId,state.attemptId);n.boot();n.ready();n.tick();assert.equal(n.accepted.length,0);n.tracker.dispose()})
 check('catálogo alterado não reprecifica pending histórico',()=>{const e=env();track(e);const state=JSON.parse(e.store.getItem(key));state.pixelPending.whatsapp.catalogVersion='old';e.store.setItem(key,JSON.stringify(state));e.tracker.dispose();const n=env(e.store);n.boot();n.ready();n.tick();assert.equal(n.accepted.length,0);n.tracker.dispose()})
}
writeFileSync(output+`/recovery-${revised?'revisada':'original'}.json`,JSON.stringify(results,null,2))
assert(results.every(r=>r.pass))
