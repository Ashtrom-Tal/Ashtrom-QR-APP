/* =========================================================================
   QR generation helpers built on `qrcode` (node-qrcode).
   One library renders the live canvas, the PNG downloads, the PDF images
   and the SVG export — so the preview always matches what gets printed.
   ========================================================================= */

import QRCode from 'qrcode'

export type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

/** High-contrast colours that scan reliably on white labels. */
const QR_DARK = '#0f172a'
const QR_LIGHT = '#ffffff'

/** Use the strongest error correction when a centre logo is present. */
export function qrLevelFor(hasInnerLogo: boolean): ErrorLevel {
  return hasInnerLogo ? 'H' : 'M'
}

export interface QrRenderOptions {
  /** Pixel edge length of the rendered QR (excluding nothing — total size). */
  size: number
  level: ErrorLevel
  /** Optional data URL of a logo to place in the centre. */
  logoDataUrl?: string
  /** Quiet-zone margin in modules. */
  margin?: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load logo image.'))
    img.src = src
  })
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Composite a centred logo (with a white padded background) onto the canvas. */
async function drawCenterLogo(
  canvas: HTMLCanvasElement,
  logoDataUrl: string,
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = await loadImage(logoDataUrl)

  const box = Math.round(canvas.width * 0.22)
  const x = Math.round((canvas.width - box) / 2)
  const y = Math.round((canvas.height - box) / 2)
  const pad = Math.round(box * 0.14)

  ctx.fillStyle = QR_LIGHT
  roundRectPath(ctx, x - pad, y - pad, box + pad * 2, box + pad * 2, Math.round(box * 0.16))
  ctx.fill()

  const ratio = Math.min(box / img.width, box / img.height)
  const w = img.width * ratio
  const h = img.height * ratio
  ctx.drawImage(img, x + (box - w) / 2, y + (box - h) / 2, w, h)
}

/**
 * Render a QR code onto an existing canvas (used for live, crisp previews).
 * Scales to the device pixel ratio for sharpness.
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  opts: QrRenderOptions,
): Promise<void> {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  const px = Math.max(1, Math.round(opts.size * dpr))

  await QRCode.toCanvas(canvas, value, {
    width: px,
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.level,
    color: { dark: QR_DARK, light: QR_LIGHT },
  })

  canvas.style.width = `${opts.size}px`
  canvas.style.height = `${opts.size}px`

  if (opts.logoDataUrl) {
    await drawCenterLogo(canvas, opts.logoDataUrl)
  }
}

/** Generate a high-resolution PNG data URL (downloads + PDF embedding). */
export async function generateQrPngDataUrl(
  value: string,
  opts: QrRenderOptions,
): Promise<string> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, value, {
    width: opts.size,
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.level,
    color: { dark: QR_DARK, light: QR_LIGHT },
  })
  if (opts.logoDataUrl) {
    await drawCenterLogo(canvas, opts.logoDataUrl)
  }
  return canvas.toDataURL('image/png')
}

function injectSvgLogo(svg: string, logoDataUrl: string): string {
  const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  if (!match) return svg
  const vb = parseFloat(match[1])
  const box = vb * 0.22
  const pos = (vb - box) / 2
  const pad = box * 0.14
  const overlay =
    `<rect x="${pos - pad}" y="${pos - pad}" width="${box + pad * 2}" height="${
      box + pad * 2
    }" rx="${box * 0.16}" fill="${QR_LIGHT}"/>` +
    `<image href="${logoDataUrl}" x="${pos}" y="${pos}" width="${box}" height="${box}" preserveAspectRatio="xMidYMid meet"/>`
  return svg.replace('</svg>', `${overlay}</svg>`)
}

/** Generate a scalable SVG string for download. */
export async function generateQrSvgString(
  value: string,
  opts: Pick<QrRenderOptions, 'level' | 'logoDataUrl' | 'margin'>,
): Promise<string> {
  let svg = await QRCode.toString(value, {
    type: 'svg',
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.level,
    color: { dark: QR_DARK, light: QR_LIGHT },
  })
  if (opts.logoDataUrl) {
    svg = injectSvgLogo(svg, opts.logoDataUrl)
  }
  return svg
}
