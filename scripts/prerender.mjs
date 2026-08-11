import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const serverEntry = pathToFileURL(resolve(root, 'dist-ssr/entry-server.js')).href
const { render, getPageMetadata, PUBLIC_INDEXABLE_PATHS } = await import(serverEntry)
const baseTemplate = readFileSync(resolve(dist, 'index.html'), 'utf8')

const escapeAttribute = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const renderDocument = (pathname) => {
  const metadata = getPageMetadata(pathname)
  const appHtml = render(pathname)
  let html = baseTemplate
    .replace(/<title>[^<]*<\/title>/i, `<title>${metadata.title}</title>`)
    .replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']+["']\s*\/>/i, `<link rel="canonical" href="${metadata.canonical}" />`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta name="description" content="${escapeAttribute(metadata.description)}" />`,
  )
  html = html.replace(
    /<meta\s+name=["']title["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta name="title" content="${escapeAttribute(metadata.title)}" />`,
  )
  html = html.replace(
    /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta property="og:url" content="${metadata.canonical}" />`,
  )
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta property="og:title" content="${escapeAttribute(metadata.title)}" />`,
  )
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta property="og:description" content="${escapeAttribute(metadata.description)}" />`,
  )
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta name="twitter:title" content="${escapeAttribute(metadata.title)}" />`,
  )
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/>/i,
    `<meta name="twitter:description" content="${escapeAttribute(metadata.description)}" />`,
  )

  if (pathname !== '/') {
    html = html.replace(/^.*asset_phone_main_page.*\n?/gm, '')
  }

  return html
}

for (const pathname of PUBLIC_INDEXABLE_PATHS) {
  if (pathname === '/politica-de-privacidade') continue
  const output = pathname === '/'
    ? resolve(dist, 'index.html')
    : resolve(dist, pathname.slice(1), 'index.html')
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, renderDocument(pathname))
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_INDEXABLE_PATHS.map((pathname) => `  <url>\n    <loc>https://master-prime.com${pathname === '/' ? '/' : pathname}</loc>\n  </url>`).join('\n')}
</urlset>
`

writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap)
writeFileSync(resolve(dist, 'sitemap.xml'), sitemap)

console.log(`Prerendered ${PUBLIC_INDEXABLE_PATHS.length - 1} React pages and generated ${PUBLIC_INDEXABLE_PATHS.length} sitemap URLs.`)
