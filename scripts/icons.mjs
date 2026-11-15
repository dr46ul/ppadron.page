/**
 * Renders the icons the head links from public/favicon.svg, the one source of
 * the mark:
 *
 *   pnpm icons
 *
 * - public/favicon.ico at 16, 32 and 48px, for browsers without SVG favicons.
 * - public/apple-touch-icon.png at 180px with square corners, since iOS rounds
 *   its own and shows a transparent corner as black.
 *
 * app/components/SiteMark.vue draws the same shapes inline, and
 * test/unit/site-mark.test.ts fails until both match. Chromium draws the
 * pixels; see docs/agents/testing.md for installing it.
 */
import { Buffer } from 'node:buffer'
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const svg = readFileSync('public/favicon.svg', 'utf8')
const ICO_SIZES = [16, 32, 48]

const browser = await chromium.launch()
try {
  const page = await browser.newPage()

  async function png(source, size) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${source}`)
    return page.screenshot({ omitBackground: true, type: 'png' })
  }

  // The tile is the first shape drawn, so the first `rx` is its corners.
  const fullBleed = svg.replace(/ rx="\d+"/, '')
  writeFileSync('public/apple-touch-icon.png', await png(fullBleed, 180))

  const images = []
  for (const size of ICO_SIZES)
    images.push(await png(svg, size))
  writeFileSync('public/favicon.ico', ico(images))
}
finally {
  await browser.close()
}

/** An ICO file holding each PNG as is, which every browser that reads ICO accepts. */
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length + 16 * images.length
  const entries = images.map((image, index) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(ICO_SIZES[index], 0)
    entry.writeUInt8(ICO_SIZES[index], 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(image.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += image.length
    return entry
  })
  return Buffer.concat([
    header,
    ...entries,
    ...images,
  ])
}
