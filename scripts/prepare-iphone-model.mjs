// Rebuild the browser asset from the unmodified Apple download supplied by the owner.
// Usage: node scripts/prepare-iphone-model.mjs /path/to/3d/web-viewer [17|18]
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { resolve, dirname, join, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, getBounds, prune, weld, textureCompress } from '@gltf-transform/functions'
import sharp from 'sharp'

const source = resolve(process.argv[2] || '/home/wayne/Downloads/17_pro_max_laranja/apple-iphone-17-pro-max/3d/web-viewer')
const generation = process.argv[3] || '17'
const configurations = {
  '17': { scene: 'iPhone17Pro_US_L_avif.lsd', model: 'kbeEpEkAZVEQIzQ.gltf', states: ['mWZHAexiYgdmOqF.lsd', 'nGRqtPBlwSVMIjn.lsd'], colors: [['Orange', 'orange'], ['Blue', 'blue'], ['Silver', 'silver']], rotation: [0, Math.SQRT1_2, -Math.SQRT1_2, 0] },
  // Apple's internal Plum state corresponds to the supplied Burgundy imagery.
  '18': { scene: 'iPhone18Pro_US_L_avif.lsd', model: 'QqoRrDEZDJkZWqq.gltf', states: ['NkxxOAjhmlfGMZG.lsd'], colors: [['Black', 'black'], ['Plum', 'burgundy'], ['Silver', 'silver']], rotation: [0, 1, 0, 0] },
}
const config = configurations[generation]
if (!config) throw Error(`Unsupported iPhone generation: ${generation}`)
const output = resolve('src/assets/models/iphone')
const files = await readdir(source, { recursive: true })
const find = name => join(source, files.find(p => p.endsWith('/' + name)) || name)
const used = new Set()
const decoderFallbacks = []
const read = async path => { used.add(path); return readFile(path) }
const json = async path => JSON.parse(await read(path))
const scene = await json(find(config.scene))
const modelPath = find(config.model)
const gltf = await json(modelPath)
const resources = {}
for (const item of [...gltf.buffers, ...gltf.images]) {
  resources[item.uri] = new Uint8Array(await read(resolve(dirname(modelPath), item.uri)))
}
const colorStates = await Promise.all(config.states.map(name => json(find(name))))
const referencedAssets = (await Promise.all(scene.assets.filter(a => a['@type'] === 'reference').map(a => json(join(source, a['@path'].replace(/^\//, '')))))).flat()
const textureAssets = new Map([...scene.assets, ...referencedAssets].filter(a => a.type === 'texture').map(a => [a.id, a]))
const extraTextures = new Map()
async function texture(id) {
  if (extraTextures.has(id)) return extraTextures.get(id)
  const asset = textureAssets.get(id)
  if (!asset) throw Error(`Missing Apple texture ${id}`)
  const uri = `variant-${id}.avif`
  resources[uri] = new Uint8Array(await read(join(source, asset.path.replace(/^\//, ''))))
  const imageIndex = gltf.images.push({ uri, mimeType: 'image/avif' }) - 1
  const index = gltf.textures.push({ source: imageIndex }) - 1
  extraTextures.set(id, index)
  return index
}
const original = structuredClone(gltf.materials)
const colors = config.colors
gltf.extensionsUsed = [...new Set([...gltf.extensionsUsed, 'KHR_materials_variants'])]
gltf.extensions = { ...gltf.extensions, KHR_materials_variants: { variants: colors.map(([, name]) => ({ name })) } }
for (const [variant, [color, variantName]] of colors.entries()) {
  const overrides = {}
  for (const list of colorStates) for (const row of list) {
    if (row['@states']?.length === 1 && row['@states'][0] === color) {
      for (const [name, values] of Object.entries(row)) if (name !== '@states') overrides[name] = { ...overrides[name], ...values }
    }
  }
  const offset = gltf.materials.length
  for (const sourceMaterial of original) {
    const material = structuredClone(sourceMaterial)
    material.name += `-${variantName}`
    const state = overrides[sourceMaterial.name] || {}
    const pbr = material.pbrMetallicRoughness ||= {}
    if ('colorR' in state) pbr.baseColorFactor = [state.colorR, state.colorG, state.colorB, pbr.baseColorFactor?.[3] ?? 1]
    if (state.diffuseColor === null) delete pbr.baseColorTexture
    if ('metalness' in state) pbr.metallicFactor = Math.min(1, Math.max(0, state.metalness))
    if ('roughness' in state) pbr.roughnessFactor = Math.min(1, Math.max(0, state.roughness))
    if (state.map) pbr.baseColorTexture = { index: await texture(state.map), texCoord: textureAssets.get(state.map).properties?.channel ?? 0 }
    if (state.emissiveMap) material.emissiveTexture = { index: await texture(state.emissiveMap), texCoord: textureAssets.get(state.emissiveMap).properties?.channel ?? 0 }
    if (state.aoMap) material.occlusionTexture = { index: await texture(state.aoMap), texCoord: textureAssets.get(state.aoMap).properties?.channel ?? 0, strength: 1 }
    gltf.materials.push(material)
  }
  for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
    primitive.extensions ||= {}
    const variants = primitive.extensions.KHR_materials_variants ||= { mappings: [] }
    variants.mappings.push({ material: offset + primitive.material, variants: [variant] })
  }
}
// Source coordinate systems differ; orient each handset upright with its back
// toward +Z for the shared camera presets, then convert centimetres to metres.
for (const s of gltf.scenes) {
  const root = gltf.nodes.push({ name: 'Upright product', children: s.nodes, rotation: config.rotation, scale: [.01, .01, .01] }) - 1
  s.nodes = [root]
}
// The source AVIF maps are decoded locally. Browser output uses portable WebP,
// with no external decoders, Apple runtime, environment planes or tracking code.
for (const image of gltf.images) {
  const old = image.uri
  image.uri = old.replace(/\.[^.]+$/, '.png')
  image.mimeType = 'image/png'
  try {
    resources[image.uri] = new Uint8Array(await sharp(resources[old]).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png().toBuffer())
  } catch (error) {
    // Some supplied AVIF containers have offsets rejected by libheif but decode
    // with FFmpeg. Decode the same bytes; never substitute another color's map.
    try {
      const png = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'], { input: resources[old], maxBuffer: 64 * 1024 * 1024 })
      resources[image.uri] = new Uint8Array(await sharp(png).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png().toBuffer())
      decoderFallbacks.push(old)
    } catch {
      throw new Error(`Cannot decode texture ${old}`, { cause: error })
    }
  }
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.readJSON({ json: gltf, resources })
await document.transform(dedup(), weld(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 85 }))
const bounds = getBounds(document.getRoot().listScenes()[0])
const [width, height, depth] = bounds.max.map((value, i) => value - bounds.min[i])
if (!(height > width * 1.5 && width > depth * 3)) throw Error('Handset must be upright before export')
const binary = await io.writeBinary(document)
if (binary.byteLength > 5_000_000) throw Error(`Model exceeds 5 MB: ${binary.byteLength}`)
await mkdir(output, { recursive: true })
await writeFile(join(output, `iphone-${generation}-pro.glb`), binary)
const hash = data => createHash('sha256').update(data).digest('hex')
const sources = await Promise.all([...used].sort().map(async path => ({ path: relative(source, path), sha256: hash(await readFile(path)) })))
await writeFile(join(output, generation === '17' ? 'sources.json' : `iphone-${generation}-pro.sources.json`), JSON.stringify({
  source: generation === '17' ? 'https://www.apple.com/mk/iphone-17-pro/' : '/home/wayne/Downloads/18_pro_max/3d/web-viewer',
  geometry: `iPhone ${generation} Pro; shared design presentation from the owner-supplied Pro / Pro Max media package`,
  processing: 'Handset only; Apple global color states translated to KHR_materials_variants; upright metre scale; maps resized to at most 1024px and encoded WebP quality 85; deduplicated and welded. Standard PBR lighting replaces Apple Lotus custom shaders.',
  bytes: binary.byteLength, sha256: hash(binary), variants: colors.map(([, name]) => name), sourceStates: Object.fromEntries(colors.map(([state, name]) => [name, state])), decoderFallbacks, sources,
}, null, 2) + '\n')
console.log(`Prepared ${binary.byteLength} bytes with ${colors.map(([, name]) => name).join(', ')} variants`)
