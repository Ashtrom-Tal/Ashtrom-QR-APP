/* =========================================================================
   PDF / label export engine built on jsPDF.
   Lays out QR codes programmatically (in millimetres) so the output stays
   sharp, scannable, and never splits a label across a page break.
   ========================================================================= */

import { jsPDF } from 'jspdf'
import type { ExportSettings, LogoPosition, QRItem } from '../types'
import {
  FONT_SCALE_FACTOR,
  MARGIN_MM,
  QR_SIZE_MM,
  QR_TYPE_LABELS,
  TEMPLATE_MAP,
} from '../constants'
import { generateQrPngDataUrl, qrLevelFor } from './qr'
import { formatDate, isoDateStamp, sanitizeFilename } from './format'
import { ensureHebrewFont, fontFor, hasRtl } from './pdfFonts'

type RGB = [number, number, number]
const TEXT: RGB = [15, 23, 42]
const MUTED: RGB = [100, 116, 139]
const BORDER: RGB = [203, 213, 225]

/** pt -> mm line height. */
function lineHeight(pt: number): number {
  return pt * 0.3528 * 1.28
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image.'))
    img.src = src
  })
}

/** Rasterise any logo (incl. SVG) to a PNG data URL and report its aspect. */
async function rasterizeLogo(
  dataUrl: string,
): Promise<{ url: string; aspect: number }> {
  const img = await loadImage(dataUrl)
  const w = img.naturalWidth || img.width || 256
  const h = img.naturalHeight || img.height || 256
  const maxPx = 512
  const scale = Math.min(1, maxPx / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(img, 0, 0, cw, ch)
  return { url: canvas.toDataURL('image/png'), aspect: cw / ch }
}

function truncate(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text
  let t = text
  while (t.length > 1 && doc.getTextWidth(`${t}…`) > maxW) {
    t = t.slice(0, -1)
  }
  return `${t.trim()}…`
}

interface LabelLine {
  text: string
  size: number
  bold?: boolean
  color: RGB
}

/** Build the ordered text lines for one label, respecting visible-field flags. */
function buildLabelLines(
  doc: jsPDF,
  item: QRItem,
  settings: ExportSettings,
  innerW: number,
  compact: boolean,
  font: string,
): LabelLine[] {
  const f = settings.visibleFields
  const lines: LabelLine[] = []
  const k = FONT_SCALE_FACTOR[settings.fontScale]
  const base = (compact ? 6.5 : 8) * k
  const nameSize = (compact ? 7.5 : 10) * k
  const small = (compact ? 6 : 7) * k

  const push = (
    text: string | undefined,
    size: number,
    color: RGB,
    bold = false,
  ) => {
    const value = (text ?? '').trim()
    if (!value) return
    pickFont(doc, value, font, bold, size)
    lines.push({ text: truncate(doc, value, innerW), size, bold, color })
  }

  if (f.name) push(item.name, nameSize, TEXT, true)
  if (f.type) push(QR_TYPE_LABELS[item.type], base, MUTED)
  if (f.project) push(item.project, base, MUTED)
  if (f.area) push(item.area, base, MUTED)

  if (f.description && item.description?.trim()) {
    const desc = item.description.trim()
    pickFont(doc, desc, font, false, base)
    const maxLines = compact ? 1 : 2
    const wrapped: string[] = doc.splitTextToSize(desc, innerW)
    wrapped.slice(0, maxLines).forEach((raw, i) => {
      const text =
        i === maxLines - 1 && wrapped.length > maxLines
          ? truncate(doc, raw, innerW)
          : raw
      lines.push({ text, size: base, color: MUTED })
    })
  }

  if (f.createdDate) {
    push(`Created ${formatDate(item.createdAt)}`, small, MUTED)
  }

  return lines
}

function setColor(doc: jsPDF, c: RGB): void {
  doc.setTextColor(c[0], c[1], c[2])
}

/** setFont + setFontSize, swapping to Heebo when the text is RTL. */
function pickFont(
  doc: jsPDF,
  text: string,
  latinFont: string,
  bold: boolean,
  size: number,
): void {
  doc.setFont(fontFor(text, latinFont), bold ? 'bold' : 'normal')
  doc.setFontSize(size)
}

/** doc.text wrapper that flips RTL strings so Hebrew reads right-to-left. */
function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: { align?: 'left' | 'center' | 'right' },
): void {
  if (hasRtl(text)) {
    doc.text(text, x, y, { ...options, isInputRtl: true } as never)
  } else {
    doc.text(text, x, y, options)
  }
}

/** Default, sanitised PDF filename. */
export function buildPdfFilename(items: QRItem[], settings: ExportSettings): string {
  if (items.length === 1) {
    return `qr-${sanitizeFilename(items[0].name)}.pdf`
  }
  if (settings.pdfTitle.trim()) {
    return `qr-codes-${sanitizeFilename(settings.pdfTitle)}.pdf`
  }
  const projects = new Set(
    items.map((i) => i.project?.trim()).filter((p): p is string => !!p),
  )
  if (projects.size === 1) {
    return `qr-codes-${sanitizeFilename([...projects][0])}.pdf`
  }
  return `qr-codes-${isoDateStamp()}.pdf`
}

export type ExportAction = 'save' | 'print'

interface ResolvedLogo {
  url: string
  aspect: number
  position: LogoPosition
}

/**
 * Render the selected items to a PDF and either download it or open the
 * browser print dialog. Throws on failure so the caller can show a toast.
 */
export async function exportToPdf(
  items: QRItem[],
  settings: ExportSettings,
  action: ExportAction,
): Promise<void> {
  if (items.length === 0) {
    throw new Error('There are no QR codes to export.')
  }

  // 1. Pre-render every QR as a high-resolution PNG.
  const innerLogo = settings.innerLogoEnabled ? settings.innerLogoDataUrl : undefined
  const level = qrLevelFor(settings.innerLogoEnabled && !!settings.innerLogoDataUrl)
  const pngById = new Map<string, string>()
  for (const item of items) {
    pngById.set(
      item.id,
      await generateQrPngDataUrl(item.url, { size: 620, level, logoDataUrl: innerLogo }),
    )
  }

  // 2. Rasterise the cell logos (up to 2). Drop any with no uploaded image.
  const cellLogos: ResolvedLogo[] = []
  for (const logo of settings.logos) {
    if (!logo.dataUrl) continue
    try {
      const raster = await rasterizeLogo(logo.dataUrl)
      cellLogos.push({ ...raster, position: logo.position })
    } catch {
      /* skip a broken upload */
    }
  }

  // 3. Document + geometry.
  const font = settings.fontFamily
  const k = FONT_SCALE_FACTOR[settings.fontScale]

  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: settings.pageSize,
  })
  // Make Heebo available before any text is measured or drawn.
  await ensureHebrewFont(doc)
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const m = MARGIN_MM[settings.margin]
  const contentW = W - 2 * m

  const tpl = TEMPLATE_MAP[settings.template]
  const { cols, rows, compact = false } = tpl
  const perPage = cols * rows
  const totalPages = Math.ceil(items.length / perPage)

  // Header block (page 1 only).
  const hasTitle = !!settings.pdfTitle.trim()
  const hasSub = !!settings.pdfSubtitle.trim()
  const hasNote = !!settings.customNote.trim()
  const titleSize = 16 * k
  const subSize = 10.5 * k
  const noteSize = 9 * k
  if (hasNote) pickFont(doc, settings.customNote, font, false, noteSize)
  else doc.setFontSize(noteSize)
  const noteLines: string[] = hasNote
    ? doc.splitTextToSize(settings.customNote.trim(), contentW)
    : []
  let headerH = 0
  if (hasTitle) headerH += lineHeight(titleSize) + 1
  if (hasSub) headerH += lineHeight(subSize) + 0.5
  if (hasNote) headerH += noteLines.length * lineHeight(noteSize)
  if (headerH > 0) headerH += 4

  const hasFooter = !!settings.footerText.trim()
  const footerSize = 8 * k

  function drawPageChrome(pageIndex: number): void {
    // First-page header.
    if (pageIndex === 0 && headerH > 0) {
      let y = m
      const cx = m + contentW / 2
      if (hasTitle) {
        const t = settings.pdfTitle.trim()
        pickFont(doc, t, font, true, titleSize)
        setColor(doc, TEXT)
        drawText(doc, t, cx, y + lineHeight(titleSize) * 0.7, { align: 'center' })
        y += lineHeight(titleSize) + 1
      }
      if (hasSub) {
        const s = settings.pdfSubtitle.trim()
        pickFont(doc, s, font, false, subSize)
        setColor(doc, MUTED)
        drawText(doc, s, cx, y + lineHeight(subSize) * 0.7, { align: 'center' })
        y += lineHeight(subSize) + 0.5
      }
      if (hasNote) {
        setColor(doc, MUTED)
        noteLines.forEach((ln) => {
          pickFont(doc, ln, font, false, noteSize)
          drawText(doc, ln, cx, y + lineHeight(noteSize) * 0.7, { align: 'center' })
          y += lineHeight(noteSize)
        })
      }
    }

    // Footer: custom text (left) + page numbers (right).
    setColor(doc, MUTED)
    const fy = H - m + 4
    if (hasFooter) {
      const ft = truncate(doc, settings.footerText.trim(), contentW - 30)
      pickFont(doc, ft, font, false, footerSize)
      drawText(doc, ft, m, fy)
    }
    doc.setFont(font, 'normal')
    doc.setFontSize(footerSize)
    doc.text(`Page ${pageIndex + 1} of ${totalPages}`, W - m, fy, { align: 'right' })
  }

  function gridRect(pageIndex: number) {
    const top = m + (pageIndex === 0 ? headerH : 0)
    const bottom = H - m
    return { x: m, y: top, w: contentW, h: bottom - top }
  }

  /** Resolve logo sizes for a given cell width. */
  function sizedCellLogos(cw: number): { logo: ResolvedLogo; w: number; h: number }[] {
    if (!cellLogos.length) return []
    const maxW = cw * 0.28
    const maxH = compact ? 6 : 9
    return cellLogos.map((logo) => {
      let w = maxW
      let h = w / logo.aspect
      if (h > maxH) {
        h = maxH
        w = h * logo.aspect
      }
      return { logo, w, h }
    })
  }

  function drawCell(
    item: QRItem,
    cx0: number,
    cy0: number,
    cw: number,
    ch: number,
  ): void {
    const pad = compact ? 2 : 3
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2])
    doc.setLineWidth(0.2)
    doc.roundedRect(cx0 + 0.6, cy0 + 0.6, cw - 1.2, ch - 1.2, 2, 2, 'S')

    const innerW = cw - pad * 2
    const cx = cx0 + cw / 2

    // Per-cell logos: reserve top/bottom bands inside the cell.
    const sized = sizedCellLogos(cw)
    const topLogos = sized.filter((s) => s.logo.position.startsWith('top'))
    const bottomLogos = sized.filter((s) => s.logo.position.startsWith('bottom'))
    const topBand = topLogos.length ? Math.max(...topLogos.map((s) => s.h)) + 1.5 : 0
    const bottomBand = bottomLogos.length
      ? Math.max(...bottomLogos.map((s) => s.h)) + 1.5
      : 0

    // Draw the top logos pinned to the top of the cell.
    for (const s of topLogos) {
      let lx = cx0 + pad
      if (s.logo.position.endsWith('center')) lx = cx - s.w / 2
      else if (s.logo.position.endsWith('right')) lx = cx0 + cw - pad - s.w
      doc.addImage(s.logo.url, 'PNG', lx, cy0 + pad, s.w, s.h)
    }
    // Draw the bottom logos pinned to the bottom of the cell.
    for (const s of bottomLogos) {
      let lx = cx0 + pad
      if (s.logo.position.endsWith('center')) lx = cx - s.w / 2
      else if (s.logo.position.endsWith('right')) lx = cx0 + cw - pad - s.w
      doc.addImage(s.logo.url, 'PNG', lx, cy0 + ch - pad - s.h, s.w, s.h)
    }

    const lines = buildLabelLines(doc, item, settings, innerW, compact, font)
    const textH = lines.reduce((sum, l) => sum + lineHeight(l.size), 0)

    const usableTop = cy0 + pad + topBand
    const usableBottom = cy0 + ch - pad - bottomBand
    const usableH = usableBottom - usableTop

    let qrEdge = Math.min(QR_SIZE_MM[settings.qrSize], innerW)
    const maxQr = usableH - textH - (lines.length ? 2.5 : 0)
    if (qrEdge > maxQr) qrEdge = Math.max(maxQr, 12)

    const blockH = qrEdge + (lines.length ? 2.5 : 0) + textH
    let top = usableTop + (usableH - blockH) / 2
    if (top < usableTop) top = usableTop

    const png = pngById.get(item.id)
    if (png) {
      doc.addImage(png, 'PNG', cx - qrEdge / 2, top, qrEdge, qrEdge)
    }

    let ty = top + qrEdge + 3
    for (const l of lines) {
      pickFont(doc, l.text, font, !!l.bold, l.size)
      setColor(doc, l.color)
      drawText(doc, l.text, cx, ty, { align: 'center' })
      ty += lineHeight(l.size)
    }
  }

  // 4. Place items.
  items.forEach((item, i) => {
    const cellIndex = i % perPage
    const pageIndex = Math.floor(i / perPage)
    if (cellIndex === 0) {
      if (pageIndex > 0) doc.addPage()
      drawPageChrome(pageIndex)
    }
    const grid = gridRect(pageIndex)
    const cellW = grid.w / cols
    const cellH = grid.h / rows
    const col = cellIndex % cols
    const row = Math.floor(cellIndex / cols)
    drawCell(item, grid.x + col * cellW, grid.y + row * cellH, cellW, cellH)
  })

  // 5. Output.
  const filename = buildPdfFilename(items, settings)
  if (action === 'print') {
    doc.autoPrint()
    const url = doc.output('bloburl')
    const win = window.open(url, '_blank')
    if (!win) {
      // Pop-up blocked — fall back to a normal download.
      doc.save(filename)
    }
  } else {
    doc.save(filename)
  }
}
