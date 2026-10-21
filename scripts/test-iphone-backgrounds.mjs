import assert from 'node:assert/strict'
import { test } from 'node:test'
import { removeConnectedIPhoneMatte } from './lib/iphone-background-mask.mjs'

test('a connected matte becomes transparent while enclosed white phone details and RGB stay exact', () => {
  const width = 20, height = 20
  const pixels = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4
    const frame = x >= 5 && x <= 14 && y >= 4 && y <= 15 && (x === 5 || x === 14 || y === 4 || y === 15)
    pixels.set(frame ? [45, 45, 45, 255] : [245, 245, 247, 255], offset)
  }
  const original = Buffer.from(pixels)
  const masked = removeConnectedIPhoneMatte(pixels, width, height)
  assert(masked.removedPixels > 200)
  assert.equal(masked.pixels[3], 0)
  const interior = (10 * width + 10) * 4
  assert.deepEqual([...masked.pixels.subarray(interior, interior + 4)], [245, 245, 247, 255], 'white detail inside the handset is opaque')
  assert.deepEqual(pixels, original, 'source buffer is immutable')
  for (let i = 0; i < pixels.length; i += 4) assert.deepEqual(masked.pixels.subarray(i, i + 3), pixels.subarray(i, i + 3), 'RGB never changes')
})
test('existing alpha cutouts and non-white images remain byte-for-byte unchanged', () => {
  for (const transparent of [false, true]) {
    const pixels = Buffer.alloc(20 * 20 * 4)
    for (let i = 0; i < pixels.length; i += 4) pixels.set([30, 40, 50, transparent ? 0 : 255], i)
    const result = removeConnectedIPhoneMatte(pixels, 20, 20)
    assert.deepEqual(result.pixels, pixels)
    assert.equal(result.removedPixels, 0)
  }
})

test('every production cutout retains its verified lossless source bytes', async () => {
  const { readFile, readdir } = await import('node:fs/promises')
  const { createHash } = await import('node:crypto')
  const { basename } = await import('node:path')
  const hash = buffer => createHash('sha256').update(buffer).digest('hex')
  const sources = JSON.parse(await readFile('src/assets/images/iphone/apple-used/sources.json', 'utf8'))
  const built = await readdir('dist/assets')
  assert.equal(sources.length, 58)
  for (const source of sources) {
    assert(source.background_mask, 'preparation records the alpha-mask operation')
    const bytes = await readFile(source.workspace_path)
    assert.equal(hash(bytes), source.output_sha256)
    const name = basename(source.workspace_path, '.webp')
    const asset = built.find(filename => filename.startsWith(`${name}-`) && filename.endsWith('.webp'))
    assert(asset, `Missing built cutout: ${name}`)
    assert.equal(hash(await readFile(`dist/assets/${asset}`)), hash(bytes), `Build must not re-encode ${name}`)
  }
})
