import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const siteUrl = 'https://master-prime.com'

function read(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function metadata(html, label) {
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
  const description = html.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
  )?.[1]
  const canonical = html.match(
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
  )?.[1]

  assert(title, `${label}: title ausente`)
  assert(description, `${label}: meta description ausente`)
  assert(canonical, `${label}: canonical ausente`)
  assert(!/<meta\s+name=["']keywords["']/i.test(html), `${label}: meta keywords presente`)

  const schemas = [...html.matchAll(
    /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi,
  )]
  assert(schemas.length > 0, `${label}: JSON-LD ausente`)
  for (const [, schemaText] of schemas) JSON.parse(schemaText)

  return { title, description, canonical }
}

function files(directory) {
  return readdirSync(resolve(root, directory)).flatMap((name) => {
    const relativePath = `${directory}/${name}`
    const fullPath = resolve(root, relativePath)
    return statSync(fullPath).isDirectory() ? files(relativePath) : [relativePath]
  })
}

const home = read('index.html')
const privacy = read('public/politica-de-privacidade/index.html')
const hero = read('src/components/sections/Hero.tsx')
const services = read('src/components/sections/Services.tsx')
const homeMetadata = metadata(home, 'home')
const privacyMetadata = metadata(privacy, 'política de privacidade')

assert(homeMetadata.canonical === `${siteUrl}/`, 'canonical da home incorreto')
assert(
  privacyMetadata.canonical === `${siteUrl}/politica-de-privacidade`,
  'canonical da política de privacidade incorreto',
)
assert(homeMetadata.title !== privacyMetadata.title, 'titles duplicados')
assert(homeMetadata.description !== privacyMetadata.description, 'descriptions duplicadas')
assert(home.includes('"@type": "ComputerStore"'), 'ComputerStore ausente na home')
assert(
  home.includes(`${siteUrl}/#localbusiness`),
  'identificador consistente do LocalBusiness ausente',
)
assert(home.includes('Avenida%20Ces%C3%A1rio%20de%20Melo%2C%202571'), 'hasMap não aponta para 2571')
assert(hero.includes('Assistência Técnica em Campo Grande'), 'H1 não comunica assistência técnica')
for (const service of ['Celulares', 'Notebooks', 'Computadores', 'Videogames', 'Controles']) {
  assert(services.includes(service), `serviço visível ausente: ${service}`)
}

const sitemap = read('public/sitemap.xml')
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
)
assert(sitemapLocations.length === 2, 'sitemap deve conter duas URLs indexáveis')
assert(sitemapLocations.includes(`${siteUrl}/`), 'home ausente do sitemap')
assert(
  sitemapLocations.includes(`${siteUrl}/politica-de-privacidade`),
  'política de privacidade ausente do sitemap',
)
assert(!sitemap.includes('presell'), 'rota redirecionada presente no sitemap')

const robots = read('public/robots.txt')
assert(robots.includes('User-agent: *'), 'robots sem user-agent')
assert(robots.includes('Allow: /'), 'robots não permite páginas públicas')
assert(
  robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`),
  'robots sem sitemap absoluto',
)

const vercel = JSON.parse(read('vercel.json'))
assert(
  !(vercel.rewrites ?? []).some((rewrite) => rewrite.source === '/(.*)'),
  'catch-all de SPA ainda gera soft 404',
)
assert(
  (vercel.redirects ?? []).some(
    (redirect) => redirect.source === '/presell' && redirect.statusCode === 301,
  ),
  'redirect 301 de /presell ausente',
)

const publicSource = [
  'index.html',
  'vercel.json',
  '.env.example',
  ...files('src').filter((path) => /\.(?:ts|tsx|css)$/i.test(path)),
  ...files('public').filter((path) => /\.(?:html|xml|txt)$/i.test(path)),
]
  .map(read)
  .join('\n')

const forbidden = [
  [/\b2581\b/, 'endereço antigo terminado em 2581'],
  [/\b2869\b/, 'endereço antigo terminado em 2869'],
  [/lp\.master-prime\.com/i, 'subdomínio descartado'],
  [/masterprime\.com\.br/i, 'domínio antigo'],
  [/5521999999999/, 'telefone placeholder'],
  [/your_embed_url/i, 'mapa placeholder'],
  [/share\.google\/qAUljzZmA4mBCAknf/i, 'link do Google que redireciona ao endereço antigo'],
  [/A partir de R\$ \d+/i, 'preço não confirmado'],
]

for (const [pattern, label] of forbidden) {
  assert(!pattern.test(publicSource), `conteúdo público contém ${label}`)
}

assert(
  publicSource.includes('Avenida Cesário de Melo, 2571'),
  'endereço canônico não encontrado',
)
assert(publicSource.includes('5521967635340'), 'telefone canônico não encontrado')

const navigationTargets = ['hero', 'services', 'how-it-works', 'testimonials', 'location', 'faq']
for (const target of navigationTargets) {
  assert(
    publicSource.includes(`id="${target}"`) || publicSource.includes(`id='${target}'`),
    `destino de navegação ausente: #${target}`,
  )
}

console.log('SEO validation passed for the home, privacy page, redirects and discovery files.')
