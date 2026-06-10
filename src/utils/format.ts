/* Formatting helpers: dates, URL shortening, filename sanitising. */

/** "12 Mar 2026" — locale-aware, compact. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** YYYY-MM-DD, used for default export filenames. */
export function isoDateStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Shorten a URL visually (e.g. "drive.google.com/…/Site-Photos").
 * The full URL is still available for copy / open.
 */
export function shortenUrl(url: string, max = 42): string {
  let display = url
  try {
    const u = new URL(url)
    const path = u.pathname === '/' ? '' : u.pathname
    display = `${u.host}${path}${u.search}`
  } catch {
    // not a parseable URL — fall back to the raw string
  }
  if (display.length <= max) return display
  const head = display.slice(0, Math.ceil(max * 0.6))
  const tail = display.slice(-Math.floor(max * 0.3))
  return `${head}…${tail}`
}

/**
 * Turn an arbitrary string into a safe filename fragment.
 * Keeps letters, numbers, dash and underscore.
 */
export function sanitizeFilename(input: string, fallback = 'qr'): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  return cleaned || fallback
}
