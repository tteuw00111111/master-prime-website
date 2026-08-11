import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const siteUrl = 'https://master-prime.com'
const seoPages = JSON.parse(readFileSync(resolve(root, 'src/data/seo-pages.json'), 'utf8'))
const expectedPaths = ['/', '/servicos', ...seoPages.map((page) => page.path), '/politica-de-privacidade']
const expectedPathSet = new Set(expectedPaths)

const read = (path) => readFileSync(resolve(root, path), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const files = (directory) => readdirSync(resolve(root, directory)).flatMap((name) => {
  const relativePath = `${directory}/${name}`
  return statSync(resolve(root, relativePath)).isDirectory() ? files(relativePath) : [relativePath]
})

const outputFile = (pathname) => pathname === '/'
  ? 'dist/index.html'
  : `dist/${pathname.slice(1)}/index.html`

const parseMetadata = (html, label) => {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]
  const h1Count = (html.match(/<h1\b/gi) ?? []).length
  const schemas = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]))

  assert(title, `${label}: title ausente`)
  assert(description, `${label}: description ausente`)
  assert(canonical, `${label}: canonical ausente`)
  assert(h1Count === 1, `${label}: deve conter exatamente um H1; encontrado ${h1Count}`)
  assert(!/<meta\s+name=["']keywords["']/i.test(html), `${label}: meta keywords presente`)
  assert(schemas.length > 0, `${label}: JSON-LD ausente ou inválido`)

  return { title, description, canonical, schemas }
}

const schemaTypes = (schemas) => {
  const types = new Set()
  const visit = (value) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) return value.forEach(visit)
    const type = value['@type']
    if (Array.isArray(type)) type.forEach((item) => types.add(item))
    else if (type) types.add(type)
    Object.values(value).forEach(visit)
  }
  schemas.forEach(visit)
  return types
}

const pageReports = []
for (const pathname of expectedPaths) {
  const html = read(outputFile(pathname))
  const report = parseMetadata(html, pathname)
  const expectedCanonical = `${siteUrl}${pathname === '/' ? '/' : pathname}`
  assert(report.canonical === expectedCanonical, `${pathname}: canonical incorreto`)
  assert(!/noindex/i.test(html.match(/<meta\s+name=["']robots["'][^>]*>/i)?.[0] ?? ''), `${pathname}: noindex inesperado`)

  const serializedSchema = JSON.stringify(report.schemas)
  assert(!/AggregateRating|"Review"/i.test(serializedSchema), `${pathname}: rating/review schema não permitido`)
  assert(!/impressora/i.test(serializedSchema), `${pathname}: impressora presente em structured data`)

  if (pathname !== '/politica-de-privacidade') {
    const types = schemaTypes(report.schemas)
    assert(types.has('LocalBusiness'), `${pathname}: LocalBusiness ausente`)
    assert(serializedSchema.includes(`${siteUrl}/#localbusiness`), `${pathname}: @id da entidade inconsistente`)
    assert(serializedSchema.includes('Avenida Cesário de Melo, 2571'), `${pathname}: NAP ausente no schema`)
    if (pathname === '/servicos') {
      assert(types.has('ItemList') && types.has('BreadcrumbList'), '/servicos: ItemList ou breadcrumb ausente')
    } else if (pathname !== '/') {
      assert(types.has('Service') && types.has('BreadcrumbList'), `${pathname}: Service ou breadcrumb ausente`)
    }
  }

  if (pathname !== '/' && pathname !== '/servicos' && pathname !== '/politica-de-privacidade') {
    const visibleText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
    const wordCount = visibleText.match(/[A-Za-zÀ-ÿ]{3,}/g)?.length ?? 0
    assert(wordCount >= 450, `${pathname}: conteúdo raso (${wordCount} palavras no HTML)`)
  }

  pageReports.push({ pathname, html, ...report })
}

const titles = pageReports.map((page) => page.title)
const descriptions = pageReports.map((page) => page.description)
assert(new Set(titles).size === titles.length, 'titles duplicados entre páginas indexáveis')
assert(new Set(descriptions).size === descriptions.length, 'descriptions duplicadas entre páginas indexáveis')
assert(new Set(seoPages.map((page) => page.title)).size === seoPages.length, 'H1 duplicados nos dados de serviço')

const sitemap = read('public/sitemap.xml')
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const expectedLocations = expectedPaths.map((pathname) => `${siteUrl}${pathname === '/' ? '/' : pathname}`)
assert(sitemapLocations.length === expectedLocations.length, `sitemap deve conter ${expectedLocations.length} URLs`)
assert(new Set(sitemapLocations).size === sitemapLocations.length, 'sitemap contém URLs duplicadas')
for (const location of expectedLocations) assert(sitemapLocations.includes(location), `sitemap sem ${location}`)
assert(!/presell|inicio/i.test(sitemap), 'sitemap contém URL redirecionada')

const robots = read('public/robots.txt')
assert(robots.includes('User-agent: *') && robots.includes('Allow: /'), 'robots não permite páginas públicas')
assert(robots.includes('User-agent: OAI-SearchBot'), 'OAI-SearchBot não declarado')
assert(robots.includes('Disallow: /api/'), 'bloqueio de API ausente')
assert(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), 'robots sem sitemap absoluto')
assert(!/User-agent:\s*GPTBot/i.test(robots), 'política de GPTBot foi alterada sem instrução')

const vercel = JSON.parse(read('vercel.json'))
assert(!(vercel.rewrites ?? []).some((rewrite) => rewrite.source === '/(.*)'), 'catch-all ainda pode gerar soft 404')
for (const source of ['/presell', '/inicio']) {
  assert((vercel.redirects ?? []).some((redirect) => redirect.source === source && redirect.destination === '/' && redirect.statusCode === 301), `redirect 301 ausente: ${source}`)
}

const inbound = new Map(expectedPaths.map((pathname) => [pathname, 0]))
for (const page of pageReports) {
  const links = [...page.html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1].replaceAll('&amp;', '&'))
  for (const href of links) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    const target = href.split('#')[0] || '/'
    const assetTarget = target.split('?')[0]
    const existingAsset = existsSync(resolve(root, 'dist', assetTarget.slice(1)))
    assert(expectedPathSet.has(target) || existingAsset, `${page.pathname}: link interno quebrado para ${target}`)
    if (expectedPathSet.has(target) && target !== page.pathname) inbound.set(target, (inbound.get(target) ?? 0) + 1)
  }
}
for (const pathname of expectedPaths.filter((path) => path !== '/')) {
  assert((inbound.get(pathname) ?? 0) > 0, `${pathname}: página órfã`)
}

const activePublicFiles = [
  'index.html',
  'vercel.json',
  ...files('src').filter((path) => /\.(?:ts|tsx|json)$/i.test(path)),
  'public/robots.txt',
  'public/sitemap.xml',
]
const activePublicSource = activePublicFiles.map(read).join('\n')
const printerLines = activePublicSource.split('\n').filter((line) => /impressora/i.test(line))
assert(printerLines.every((line) => /não fazem parte dos serviços atuais/i.test(line)), 'impressora ainda aparece como serviço atual')

for (const [pattern, label] of [
  [/\b2581\b/, 'endereço antigo 2581'],
  [/\b2869\b/, 'endereço antigo 2869'],
  [/lp\.master-prime\.com/i, 'LP externa usada no conteúdo público'],
  [/masterprime\.com\.br/i, 'domínio antigo'],
  [/5521999999999/, 'telefone placeholder'],
  [/A partir de R\$ \d+/i, 'preço não confirmado'],
]) assert(!pattern.test(activePublicSource), `conteúdo público contém ${label}`)

assert(activePublicSource.includes('Avenida Cesário de Melo, 2571'), 'NAP canônico ausente')
assert(activePublicSource.includes('5521967635340'), 'telefone canônico ausente')

console.log(`SEO validation passed: ${expectedPaths.length} indexable pages, ${seoPages.length} service intents, unique metadata, valid JSON-LD, sitemap, robots, redirects and internal links.`)
