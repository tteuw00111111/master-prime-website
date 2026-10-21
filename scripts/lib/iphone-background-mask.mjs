// Remove only a flat, bright matte connected to the image boundary.
// RGB values are never changed. Existing transparent cutouts are kept intact.
export const removeConnectedIPhoneMatte = (pixels, width, height) => {
  const result = Buffer.from(pixels)
  const border = []
  for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x)
  for (let y = 1; y < height - 1; y++) border.push(y * width, y * width + width - 1)
  const transparentBorder = border.filter(index => pixels[index * 4 + 3] < 16).length
  const unchanged = { pixels: result, background: null, removedPixels: 0 }
  if (transparentBorder > border.length * .05) return unchanged

  const colors = new Map()
  for (const index of border) {
    const offset = index * 4
    const rgb = [...pixels.subarray(offset, offset + 3)]
    if (pixels[offset + 3] < 250 || Math.min(...rgb) < 220 || Math.max(...rgb) - Math.min(...rgb) > 8) continue
    const key = rgb.join(',')
    colors.set(key, (colors.get(key) || 0) + 1)
  }
  const candidate = [...colors].sort((a, b) => b[1] - a[1])[0]
  if (!candidate || candidate[1] < Math.max(20, border.length * .03)) return unchanged
  const background = candidate[0].split(',').map(Number)
  const matches = index => {
    const offset = index * 4
    return pixels[offset + 3] < 16 || background.every((value, channel) => Math.abs(pixels[offset + channel] - value) <= 6)
  }
  const seen = new Uint8Array(width * height)
  const queue = new Uint32Array(width * height)
  let read = 0, write = 0, removedPixels = 0
  const add = index => {
    if (seen[index]) return
    seen[index] = 1
    if (matches(index)) queue[write++] = index
  }
  for (const index of border) add(index)
  while (read < write) {
    const index = queue[read++]
    if (result[index * 4 + 3]) removedPixels++
    result[index * 4 + 3] = 0
    const x = index % width
    if (x > 0) add(index - 1)
    if (x < width - 1) add(index + 1)
    if (index >= width) add(index - width)
    if (index < width * (height - 1)) add(index + width)
  }
  return { pixels: result, background, removedPixels }
}
