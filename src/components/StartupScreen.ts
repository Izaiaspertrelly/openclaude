/**
 * PertrellyClaude startup screen — animated blue gradient logo.
 * Called once at CLI startup before the Ink UI renders.
 */

declare const MACRO: { VERSION: string; DISPLAY_VERSION?: string }

const ESC = '\x1b['
const RESET = `${ESC}0m`
const DIM = `${ESC}2m`
const BOLD = `${ESC}1m`
const HIDE_CURSOR = `${ESC}?25l`
const SHOW_CURSOR = `${ESC}?25h`

type RGB = [number, number, number]
const rgb = (r: number, g: number, b: number) => `${ESC}38;2;${r};${g};${b}m`

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function gradAt(stops: RGB[], t: number): RGB {
  const c = Math.max(0, Math.min(1, t))
  const s = c * (stops.length - 1)
  const i = Math.floor(s)
  if (i >= stops.length - 1) return stops[stops.length - 1]
  return lerp(stops[i], stops[i + 1], s - i)
}

function paintLine(text: string, stops: RGB[], lineT: number): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const t = text.length > 1 ? lineT * 0.4 + (i / (text.length - 1)) * 0.6 : lineT
    const [r, g, b] = gradAt(stops, t)
    out += `${rgb(r, g, b)}${text[i]}`
  }
  return out + RESET
}

function sleepSync(ms: number): void {
  const end = Date.now() + ms
  while (Date.now() < end) { /* busy wait */ }
}

// ─── Blue Gradient Colors ─────────────────────────────────────────────────────

const BLUE_GRAD: RGB[] = [
  [100, 200, 255],
  [60, 170, 255],
  [40, 140, 250],
  [20, 110, 235],
  [10, 85, 210],
  [5, 60, 180],
]

const GLOW_GRAD: RGB[] = [
  [180, 230, 255],
  [140, 210, 255],
  [100, 190, 255],
]

const ACCENT: RGB = [80, 160, 255]
const CREAM: RGB = [200, 220, 255]
const DIMCOL: RGB = [80, 110, 160]
const BORDER: RGB = [50, 90, 160]

// ─── Block Text Logo ──────────────────────────────────────────────────────────

const LOGO_PERTRELLY: string[] = []

const LOGO_CLAUDINHO = [
  `  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ██╗███╗   ██╗██╗  ██╗ ██████╗ `,
  `  ██╔═══╝██║     ██╔══██╗██║   ██║██╔══██╗██║████╗  ██║██║  ██║██╔═══██╗`,
  `  ██║    ██║     ███████║██║   ██║██║  ██║██║██╔██╗ ██║███████║██║   ██║`,
  `  ██║    ██║     ██╔══██║██║   ██║██║  ██║██║██║╚██╗██║██╔══██║██║   ██║`,
  `  ██████╗███████╗██║  ██║╚██████╔╝██████╔╝██║██║ ╚████║██║  ██║╚██████╔╝`,
  `  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ `,
]

// ─── Provider detection ───────────────────────────────────────────────────────

function detectProvider(): { name: string; model: string; baseUrl: string; isLocal: boolean } {
  const useGemini = process.env.CLAUDE_CODE_USE_GEMINI === '1' || process.env.CLAUDE_CODE_USE_GEMINI === 'true'
  const useGithub = process.env.CLAUDE_CODE_USE_GITHUB === '1' || process.env.CLAUDE_CODE_USE_GITHUB === 'true'
  const useOpenAI = process.env.CLAUDE_CODE_USE_OPENAI === '1' || process.env.CLAUDE_CODE_USE_OPENAI === 'true'

  if (useGemini) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai'
    return { name: 'Google Gemini', model, baseUrl, isLocal: false }
  }

  if (useGithub) {
    const model = process.env.OPENAI_MODEL || 'github:copilot'
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://models.github.ai/inference'
    return { name: 'GitHub Models', model, baseUrl, isLocal: false }
  }

  if (useOpenAI) {
    const rawModel = process.env.OPENAI_MODEL || 'gpt-4o'
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(baseUrl)
    let name = 'OpenAI'
    if (/deepseek/i.test(baseUrl) || /deepseek/i.test(rawModel))       name = 'DeepSeek'
    else if (/openrouter/i.test(baseUrl))                             name = 'OpenRouter'
    else if (/together/i.test(baseUrl))                               name = 'Together AI'
    else if (/groq/i.test(baseUrl))                                   name = 'Groq'
    else if (/mistral/i.test(baseUrl) || /mistral/i.test(rawModel))     name = 'Mistral'
    else if (/azure/i.test(baseUrl))                                  name = 'Azure OpenAI'
    else if (/localhost:11434/i.test(baseUrl))                        name = 'Ollama'
    else if (/localhost:1234/i.test(baseUrl))                         name = 'LM Studio'
    else if (/llama/i.test(rawModel))                                    name = 'Meta Llama'
    else if (isLocal)                                                  name = 'Local'

    let displayModel = rawModel
    const codexAliases: Record<string, { model: string; reasoningEffort?: string }> = {
      codexplan: { model: 'gpt-5.4', reasoningEffort: 'high' },
      'gpt-5.4': { model: 'gpt-5.4', reasoningEffort: 'high' },
      'gpt-5.3-codex': { model: 'gpt-5.3-codex', reasoningEffort: 'high' },
      'gpt-5.3-codex-spark': { model: 'gpt-5.3-codex-spark' },
      codexspark: { model: 'gpt-5.3-codex-spark' },
      'gpt-5.2-codex': { model: 'gpt-5.2-codex', reasoningEffort: 'high' },
      'gpt-5.1-codex-max': { model: 'gpt-5.1-codex-max', reasoningEffort: 'high' },
      'gpt-5.1-codex-mini': { model: 'gpt-5.1-codex-mini' },
      'gpt-5.4-mini': { model: 'gpt-5.4-mini', reasoningEffort: 'medium' },
      'gpt-5.2': { model: 'gpt-5.2', reasoningEffort: 'medium' },
    }
    const alias = rawModel.toLowerCase()
    if (alias in codexAliases) {
      const resolved = codexAliases[alias]
      displayModel = resolved.model
      if (resolved.reasoningEffort) {
        displayModel = `${displayModel} (${resolved.reasoningEffort})`
      }
    }

    return { name, model: displayModel, baseUrl, isLocal }
  }

  const model = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'
  return { name: 'Anthropic', model, baseUrl: 'https://api.anthropic.com', isLocal: false }
}

// ─── Box drawing ──────────────────────────────────────────────────────────────

function boxRow(content: string, width: number, rawLen: number): string {
  const pad = Math.max(0, width - 2 - rawLen)
  return `${rgb(...BORDER)}│${RESET}${content}${' '.repeat(pad)}${rgb(...BORDER)}│${RESET}`
}

// ─── Baby mascot animation ────────────────────────────────────────────────────

// Claudinho baby mascot frames. 5 lines tall, 11 columns wide.
// The baby crawls left → center, looks at the screen, waves, then crawls
// out to the right.
const BABY_HEIGHT = 5

// Crawl cycle: alternate between A and B for the walk animation.
const BABY_CRAWL_A = [
  '   ╭─────╮ ',
  '   │ ◕ᴗ◕│ ',
  '   ╰──┬──╯ ',
  '  ╱─╮ │ ╭─╲',
  '  ╰─╯ ╰ ╰─╯',
]
const BABY_CRAWL_B = [
  '   ╭─────╮ ',
  '   │ ◕ᴗ◕│ ',
  '   ╰──┬──╯ ',
  '  ╱─╮ │╭──╲',
  '   ╰─╯╯╰──╯',
]

// Baby looks at the screen and waves with one hand up.
const BABY_WAVE_UP = [
  '  ╭─────╮ ♡',
  '  │ ^ᴗ^ │╱ ',
  '  ╰──┬──╯  ',
  '  ╱──┴──╲  ',
  '  ╰──┴──╯  ',
]
const BABY_WAVE_DOWN = [
  '  ╭─────╮  ',
  '  │ ^ᴗ^ │♡ ',
  '  ╰──┬──╲╲ ',
  '  ╱──┴──╲  ',
  '  ╰──┴──╯  ',
]

// Colors for the baby (pink skin tone + blush cheeks)
const BABY_SKIN: RGB = [255, 200, 180]
const BABY_OUTLINE: RGB = [220, 120, 130]
const BABY_BLUSH: RGB = [255, 140, 160]

function paintBabyLine(line: string): string {
  // Special characters get the blush/accent color, rest is skin tone.
  let out = ''
  for (const ch of line) {
    if ('♡◕^'.includes(ch)) {
      out += rgb(...BABY_BLUSH) + ch
    } else if ('╭╮╯╰─│┬┴╲╱'.includes(ch)) {
      out += rgb(...BABY_OUTLINE) + ch
    } else if ('ᴗ'.includes(ch)) {
      out += rgb(...BABY_BLUSH) + ch
    } else {
      out += rgb(...BABY_SKIN) + ch
    }
  }
  return out + RESET
}

function drawBaby(
  w: (s: string) => void,
  frame: string[],
  offset: number,
  redrawFromAbove: boolean,
): void {
  if (redrawFromAbove) {
    // Move cursor up BABY_HEIGHT lines before redrawing
    w(`${ESC}${BABY_HEIGHT}A`)
  }
  for (const line of frame) {
    w(`${ESC}2K\r${' '.repeat(offset)}${paintBabyLine(line)}\n`)
  }
}

function animateBaby(w: (s: string) => void, termWidth: number): void {
  // Reserve BABY_HEIGHT lines of vertical space below the logo
  for (let i = 0; i < BABY_HEIGHT; i++) w('\n')

  const babyWidth = 11
  const centerX = Math.max(0, Math.floor((termWidth - babyWidth) / 2))
  const startX = 2

  // ── Phase 1: crawl in from the left to the center ──
  let step = 0
  for (let x = startX; x <= centerX; x += 2) {
    const frame = step % 2 === 0 ? BABY_CRAWL_A : BABY_CRAWL_B
    drawBaby(w, frame, x, true)
    sleepSync(90)
    step++
  }

  // ── Phase 2: pause, look at the screen, wave 3 times ──
  for (let i = 0; i < 3; i++) {
    drawBaby(w, BABY_WAVE_UP, centerX, true)
    sleepSync(220)
    drawBaby(w, BABY_WAVE_DOWN, centerX, true)
    sleepSync(220)
  }
  // Settle on the waving-up frame briefly
  drawBaby(w, BABY_WAVE_UP, centerX, true)
  sleepSync(350)

  // ── Phase 3: crawl off to the right ──
  step = 0
  for (let x = centerX; x <= termWidth - 2; x += 2) {
    const frame = step % 2 === 0 ? BABY_CRAWL_A : BABY_CRAWL_B
    drawBaby(w, frame, x, true)
    sleepSync(70)
    step++
  }

  // Clear the baby lines so the rest of the startup screen renders cleanly
  w(`${ESC}${BABY_HEIGHT}A`)
  for (let i = 0; i < BABY_HEIGHT; i++) {
    w(`${ESC}2K\n`)
  }
  // Move cursor back up one blank-line so Phase 2 (tagline) keeps tight layout
  w(`${ESC}${BABY_HEIGHT}A`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function printStartupScreen(): void {
  if (process.env.CI || !process.stdout.isTTY) return

  // Claudinho: Skip the startup screen entirely on first run (when the
  // user hasn't configured a provider yet). The onboarding flow will
  // handle the welcome experience instead.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getGlobalConfig } = require('../utils/config.js') as typeof import('../utils/config.js')
    const cfg = getGlobalConfig() as Record<string, unknown>
    if (!cfg.claudinhoApiKey) return
  } catch {
    // If config isn't ready yet, fall through and print the screen anyway.
  }

  const p = detectProvider()
  const W = 72
  const w = process.stdout.write.bind(process.stdout)

  w(HIDE_CURSOR)
  w('\n')

  // ── Phase 1: Reveal logo lines with glow → fade animation ──
  const allLogo = [...LOGO_CLAUDINHO]
  const total = allLogo.length

  for (let lineIdx = 0; lineIdx < total; lineIdx++) {
    if (allLogo[lineIdx] === '') {
      w('\n')
      sleepSync(25)
      continue
    }
    const t = total > 1 ? lineIdx / (total - 1) : 0

    // Show in bright glow first
    w(paintLine(allLogo[lineIdx], GLOW_GRAD, t) + '\n')
    sleepSync(30)

    // Overwrite with final gradient color
    w(`${ESC}1A${ESC}2K\r`)
    w(paintLine(allLogo[lineIdx], BLUE_GRAD, t) + '\n')
  }

  sleepSync(60)
  w('\n')

  // ── Phase 1.5: Claudinho baby mascot crawl & wave animation ──
  animateBaby(w, W)

  // ── Phase 2: Tagline typed out character by character ──
  const tagText = 'Any model. Every tool. Zero limits.'
  const sparkle = '✦'

  w(`  ${rgb(...ACCENT)}${sparkle}${RESET} `)
  for (let i = 0; i < tagText.length; i++) {
    const t = i / Math.max(1, tagText.length - 1)
    const col = gradAt([[180, 230, 255], [220, 240, 255], [255, 255, 255]], t)
    w(`${BOLD}${rgb(...col)}${tagText[i]}${RESET}`)
    sleepSync(10)
  }
  w(` ${rgb(...ACCENT)}${sparkle}${RESET}\n`)

  sleepSync(80)
  w('\n')

  // ── Phase 3: Provider box with sweep-in animation ──
  // Top border sweeps in
  const borderChar = '═'
  const innerW = W - 2
  w(`${rgb(...BORDER)}╔`)
  for (let i = 0; i < innerW; i++) {
    w(`${borderChar}`)
    if (i % 8 === 0) sleepSync(3)
  }
  w(`╗${RESET}\n`)
  sleepSync(20)

  const lbl = (k: string, v: string, c: RGB = CREAM): [string, number] => {
    const padK = k.padEnd(9)
    return [` ${DIM}${rgb(...DIMCOL)}${padK}${RESET} ${rgb(...c)}${v}${RESET}`, ` ${padK} ${v}`.length]
  }

  const provC: RGB = p.isLocal ? [100, 200, 140] : ACCENT

  const rows: [string, number][] = [
    lbl('Provider', p.name, provC),
    lbl('Model', p.model),
    lbl('Endpoint', p.baseUrl.length > 45 ? p.baseUrl.slice(0, 42) + '...' : p.baseUrl),
  ]

  for (const [r, l] of rows) {
    w(boxRow(r, W, l) + '\n')
    sleepSync(40)
  }

  // Separator
  w(`${rgb(...BORDER)}╠${'═'.repeat(innerW)}╣${RESET}\n`)
  sleepSync(20)

  // Status row with pulsing dot
  const sC: RGB = p.isLocal ? [100, 200, 140] : ACCENT
  const sL = p.isLocal ? 'local' : 'cloud'
  const sRow = ` ${rgb(...sC)}●${RESET} ${DIM}${rgb(...DIMCOL)}${sL}${RESET}    ${DIM}${rgb(...DIMCOL)}Ready — type ${RESET}${rgb(...ACCENT)}/help${RESET}${DIM}${rgb(...DIMCOL)} to begin${RESET}`
  const sLen = ` ● ${sL}    Ready — type /help to begin`.length
  w(boxRow(sRow, W, sLen) + '\n')
  sleepSync(20)

  // Bottom border
  w(`${rgb(...BORDER)}╚${'═'.repeat(innerW)}╝${RESET}\n`)

  // Version with fade-in
  w(`  ${DIM}${rgb(...DIMCOL)}claudinho ${RESET}${rgb(...ACCENT)}v${MACRO.DISPLAY_VERSION ?? MACRO.VERSION}${RESET}\n`)
  w('\n')

  w(SHOW_CURSOR)
}
