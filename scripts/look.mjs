/**
 * Runs one Command in a real browser and reports the block it printed: where
 * it sits in the window, whether the page followed it to the foot, and any
 * console error, with a screenshot of the window to look at.
 *
 *   pnpm look "ls ~/experience"
 *   pnpm look "cat ~/recommendations" --width 390 --height 844 --scheme light
 *   pnpm look "whoami" --keys "Meta+k,c,a,ArrowDown"
 *
 * happy-dom lays nothing out, so this is how a change to layout, scrolling,
 * focus or colour gets seen (docs/agents/testing.md). It drives the dev server
 * already running from this checkout when there is one, read from Nuxt's own
 * lock file, and starts one for the run otherwise: a second `nuxt dev` beside
 * a live one refuses to start.
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright-core'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    width: { type: 'string', default: '1100' },
    height: { type: 'string', default: '800' },
    scheme: { type: 'string', default: 'dark' },
    // Pressed in order once the Command has printed, comma-separated in
    // Playwright's spelling, for what only the keyboard opens or moves.
    keys: { type: 'string', default: '' },
    out: {
      type: 'string',
      default: join(tmpdir(), 'look.png'),
    },
  },
})

const command = positionals.join(' ')
if (!command) {
  console.error('usage: pnpm look "<command>" [--width 1100] [--height 800] [--scheme dark|light] [--keys "Meta+k,ArrowDown"] [--out file.png]')
  process.exit(1)
}

/** The live dev server's URL, or `undefined` when the lock is missing or stale. */
function runningServer() {
  try {
    const lock = JSON.parse(readFileSync('.nuxt/nuxt.lock', 'utf8'))
    process.kill(lock.pid, 0)
    return lock.url
  }
  catch {
    return undefined
  }
}

async function startServer() {
  const port = 3000 + Math.floor(Math.random() * 1000)
  const server = spawn('pnpm', [
    'exec',
    'nuxt',
    'dev',
    '--host',
    'localhost',
    '--port',
    String(port),
  ], { stdio: 'ignore' })
  const url = `http://localhost:${port}/`
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      if ((await fetch(url)).ok)
        return { url, server }
    }
    catch {}
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  server.kill()
  throw new Error(`nuxt dev did not answer on ${url} within two minutes`)
}

const live = runningServer()
const { url, server } = live
  ? { url: live, server: undefined }
  : await startServer()

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: {
      width: Number(values.width),
      height: Number(values.height),
    },
    colorScheme: values.scheme,
  })
  const errors = []
  page.on('console', message => message.type() === 'error' && errors.push(message.text()))
  page.on('pageerror', error => errors.push(error.message))

  await page.goto(url, { waitUntil: 'networkidle' })
  const before = await page.locator('[data-entry]').count()
  await page.fill('#prompt', command)
  await page.press('#prompt', 'Enter')

  // Printed once the think caret is gone from the new block; settled once a
  // smooth scroll has stopped moving the page.
  await page.locator('[data-entry]').nth(before).waitFor()
  await page.waitForFunction(() => !document.querySelector('[data-entry]:last-child .session-busy'))
  let scrollY = -1
  while (scrollY !== await page.evaluate(() => window.scrollY)) {
    scrollY = await page.evaluate(() => window.scrollY)
    await page.waitForTimeout(250)
  }

  for (const key of values.keys.split(',').filter(Boolean))
    await page.keyboard.press(key)
  if (values.keys)
    await page.waitForTimeout(300)

  const report = await page.evaluate(() => {
    const block = [
      ...document.querySelectorAll('[data-entry]'),
    ].at(-1)
    const box = block.getBoundingClientRect()
    return {
      blockTop: Math.round(box.top),
      blockHeight: Math.round(box.height),
      window: `${window.innerWidth}×${window.innerHeight}`,
      atFoot: Math.ceil(window.scrollY + window.innerHeight) >= document.body.scrollHeight - 1,
      focus: document.activeElement?.id
        || document.activeElement?.getAttribute('aria-label')
        || document.activeElement?.tagName.toLowerCase(),
    }
  })
  await page.screenshot({ path: values.out })

  console.log(JSON.stringify({
    server: url,
    command,
    ...report,
    consoleErrors: errors,
    screenshot: values.out,
  }, null, 2))
}
finally {
  await browser.close()
  server?.kill()
}
