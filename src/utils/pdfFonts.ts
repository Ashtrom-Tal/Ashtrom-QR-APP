/* =========================================================================
   PDF font loader — adds Hebrew (and Latin) support to jsPDF.
   The bundled Helvetica/Times/Courier fonts don't ship with Hebrew glyphs,
   so we lazy-load Heebo (Regular + Bold) from /public/fonts on first export.
   ========================================================================= */

import type { jsPDF } from 'jspdf'

const FONT_PATH = `${import.meta.env.BASE_URL}fonts/Heebo-Regular.ttf`

/** Detects Hebrew / Arabic characters that need the Heebo font. */
const RTL_REGEX = /[֐-׿؀-ۿ܀-ݏ]/
export function hasRtl(text: string): boolean {
  return RTL_REGEX.test(text)
}

/** Heebo PostScript family name we register inside jsPDF. */
export const HEBREW_FONT = 'Heebo'

let cachedBase64: string | null = null
let inflight: Promise<string> | null = null

/** Convert an ArrayBuffer to a base64 string without blowing the stack. */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** Load the Heebo TTF once per session, cached in memory. */
async function loadHebrewFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64
  if (inflight) return inflight
  inflight = fetch(FONT_PATH)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load Hebrew font (${r.status})`)
      return r.arrayBuffer()
    })
    .then((buf) => {
      cachedBase64 = bufferToBase64(buf)
      return cachedBase64
    })
    .catch((err) => {
      inflight = null
      throw err
    })
  return inflight
}

let registeredOnDoc = new WeakSet<jsPDF>()

/**
 * Ensure the Heebo font is registered on the given jsPDF document.
 * Safe to call multiple times.
 */
export async function ensureHebrewFont(doc: jsPDF): Promise<void> {
  if (registeredOnDoc.has(doc)) return
  const base64 = await loadHebrewFontBase64()
  doc.addFileToVFS('Heebo-Regular.ttf', base64)
  // The variable font carries every weight in a single file. Register it
  // for both normal and bold so doc.setFont(HEBREW_FONT, 'bold') works.
  doc.addFont('Heebo-Regular.ttf', HEBREW_FONT, 'normal')
  doc.addFont('Heebo-Regular.ttf', HEBREW_FONT, 'bold')
  registeredOnDoc.add(doc)
}

/**
 * Pick the right jsPDF font name for a piece of text.
 * Helvetica/Times/Courier render Hebrew as gibberish — fall back to Heebo
 * whenever the text contains RTL characters. If the user already selected
 * Heebo, use it for everything (it covers Latin too).
 */
export function fontFor(text: string, latinFont: string): string {
  if (latinFont === 'heebo') return HEBREW_FONT
  return hasRtl(text) ? HEBREW_FONT : latinFont
}
