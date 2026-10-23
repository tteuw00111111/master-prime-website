import assert from 'node:assert/strict'
import { config, createCspResolver, cspFor } from './qa/iphone-csp.mjs'
const globalCsp = cspFor('/')
const purchaseCsp = globalCsp.replace('https://www.clarity.ms;', 'https://www.clarity.ms https://scripts.clarity.ms;').replace('https://*.ggpht.com;', 'https://*.ggpht.com https://c.clarity.ms;')
const tallyPurchaseCsp = purchaseCsp.replace("frame-src 'self'", "frame-src 'self' https://tally.so")
const purchasePaths = ['/orcamento/iphone', '/orcamento/iphone/', '/orcamento/iphone?model=iphone-17-pro-max', '/orcamento/iphone/?model=iphone-17-pro-max']
const outsidePaths = ['/', '/orcamento/celular', '/orcamento/celular/', '/orcamento/iphone-extra', '/orcamento/iphone-extra/', '/servicos']
for (const path of purchasePaths) assert.equal(cspFor(path), tallyPurchaseCsp, path)
for (const path of outsidePaths) assert.equal(cspFor(path), globalCsp, path)
// Regression: without the explicit rule, Vercel's strict parser leaves the slash path on global CSP.
const previous = structuredClone(config)
previous.headers = previous.headers.filter(rule => rule.source !== '/orcamento/iphone/')
assert.equal(createCspResolver(previous)('/orcamento/iphone/'), globalCsp)
assert.equal(createCspResolver(previous)('/orcamento/iphone'), tallyPurchaseCsp)
console.log(JSON.stringify({ parser: '@vercel/routing-utils', purchasePaths, outsidePaths, regressionReproduced: true, edgeDeploymentProven: false }, null, 2))
