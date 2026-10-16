import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const source = await build({ entryPoints: [resolve(root, 'src/data/pc-build-quote.ts')], bundle: true, platform: 'node', format: 'esm', write: false })
const { PC_GAMES } = await import(`data:text/javascript;base64,${Buffer.from(source.outputFiles[0].text).toString('base64')}`)
const settings = { ...process.env }
try {
  for (const line of (await readFile(resolve(root, '.env.igdb.local'), 'utf8')).split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match && !settings[match[1]]) settings[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
} catch { /* Environment variables may supply the credentials. */ }

// Only first-party authentication receives the secret. Never log tokens, request
// URLs containing secrets, raw errors, or provider response bodies.
const getJson = async (url, init = {}) => {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(`Catalog provider returned HTTP ${response.status}`)
  return response.json()
}
const pause = () => new Promise(done => setTimeout(done, 300))
const items = {}
let provider = 'FreeToGame'
try {
  if (settings.IGDB_CLIENT_ID && settings.IGDB_CLIENT_SECRET) {
    provider = 'IGDB'
    const auth = await getJson('https://id.twitch.tv/oauth2/token', { method: 'POST', body: new URLSearchParams({ client_id: settings.IGDB_CLIENT_ID, client_secret: settings.IGDB_CLIENT_SECRET, grant_type: 'client_credentials' }) })
    if (!auth.access_token) throw new Error('Catalog authentication failed')
    for (const game of PC_GAMES) {
      await pause()
      const results = await getJson('https://api.igdb.com/v4/games', { method: 'POST', headers: { 'Client-ID': settings.IGDB_CLIENT_ID, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'text/plain' }, body: `search ${JSON.stringify(game.name)}; fields name,cover.image_id,url; where platforms = (6); limit 10;` })
      // Never attach an unrelated fuzzy search result to a familiar game name.
      const acceptedNames = [game.name, ...(game.aliases ?? [])].map(name => name.toLowerCase())
      const match = results.find(item => acceptedNames.includes(item.name?.toLowerCase()))
      if (match?.cover?.image_id && /^[a-zA-Z0-9_-]+$/.test(match.cover.image_id)) items[game.id] = { provider: 'IGDB', source: match.url, remoteImage: `https://images.igdb.com/igdb/image/upload/t_cover_big/${match.cover.image_id}.jpg` }
    }
  } else {
    const games = await getJson('https://www.freetogame.com/api/games?platform=pc')
    for (const game of PC_GAMES) {
      const match = games.find(item => item.title?.toLowerCase() === game.name.toLowerCase())
      if (match?.thumbnail?.startsWith('https://www.freetogame.com/')) items[game.id] = { provider: 'FreeToGame', source: match.freetogame_profile_url, remoteImage: match.thumbnail }
    }
  }
  if (!Object.keys(items).length) throw new Error('No matching game artwork found; previous catalog retained')
  const directory = resolve(root, 'public/images/pc-games')
  await mkdir(directory, { recursive: true })
  const images = {}
  for (const [id, item] of Object.entries(items)) {
    const url = new URL(item.remoteImage)
    if (!['images.igdb.com', 'www.freetogame.com'].includes(url.hostname)) throw new Error('Unapproved artwork host')
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error(`Artwork provider returned HTTP ${response.status}`)
    const bytes = await sharp(Buffer.from(await response.arrayBuffer())).resize(264, 374, { fit: 'cover' }).webp({ quality: 78 }).toBuffer()
    const { createHash } = await import('node:crypto')
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 10)
    const filename = `${id}-${hash}.webp`
    await writeFile(resolve(directory, filename), bytes)
    images[id] = { image: `/images/pc-games/${filename}`, source: item.source, provider: item.provider }
  }
  const manifest = resolve(root, 'src/data/pc-game-artwork.json')
  await writeFile(`${manifest}.pending`, JSON.stringify({ updatedAt: new Date().toISOString(), provider, images }, null, 2) + '\n')
  await rename(`${manifest}.pending`, manifest)
  console.log(`Imported ${Object.keys(images).length} game covers from ${provider}. Previous manifest is replaced only after every image succeeds.`)
} catch (error) {
  console.error(error instanceof Error && /^(Catalog|Artwork|No matching|Unapproved)/.test(error.message) ? error.message : 'Game import failed; previous catalog retained. Check connection and local credentials.')
  process.exitCode = 1
}
