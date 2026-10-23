// QA only. Use Vercel's parser, including strict trailing-slash matching.
// Install tooling outside the app if desired; see docs/iphone-purchase-qa.md.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { getTransformedRoutes, sourceToRegex } = await import(process.env.VERCEL_ROUTING_MODULE || '@vercel/routing-utils')
export const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'))
export const createCspResolver = candidate => {
  const parsed = getTransformedRoutes(structuredClone(candidate))
  assert.equal(parsed.error, null, JSON.stringify(parsed.error))
  const rules = candidate.headers.flatMap(rule => {
    const header = rule.headers.find(h => h.key.toLowerCase() === 'content-security-policy')
    if (!header) return []
    assert(!rule.has && !rule.missing, 'Conditional CSP needs explicit QA support')
    return [{ regex: new RegExp(sourceToRegex(rule.source).src), value: header.value }]
  })
  return input => {
    const pathname = new URL(input, 'http://localhost').pathname
    const value = rules.filter(rule => rule.regex.test(pathname)).at(-1)?.value
    assert(value, `Missing CSP for ${pathname}`)
    return value
  }
}
export const cspFor = createCspResolver(config)
