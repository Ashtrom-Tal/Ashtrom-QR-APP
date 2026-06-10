import type { ExportSettings, QRItem } from '../types'
import {
  FONT_FAMILY_CSS,
  FONT_SCALE_FACTOR,
  MARGIN_MM,
  PAGE_SIZES_MM,
  TEMPLATE_MAP,
} from '../constants'
import { PrintableLabel } from './PrintableLabel'
import styles from './PDFPreview.module.css'

const MAX_PREVIEW_PAGES = 6

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

interface PDFPreviewProps {
  items: QRItem[]
  settings: ExportSettings
}

export function PDFPreview({ items, settings }: PDFPreviewProps) {
  if (items.length === 0) {
    return <div className={styles.empty}>Select at least one QR code to preview.</div>
  }

  const tpl = TEMPLATE_MAP[settings.template]
  const perPage = tpl.cols * tpl.rows
  const allPages = chunk(items, perPage)
  const pages = allPages.slice(0, MAX_PREVIEW_PAGES)

  const dims = PAGE_SIZES_MM[settings.pageSize]
  const [pw, ph] =
    settings.orientation === 'landscape'
      ? [dims.height, dims.width]
      : [dims.width, dims.height]
  const marginPct = (MARGIN_MM[settings.margin] / pw) * 100

  const k = FONT_SCALE_FACTOR[settings.fontScale]
  const fontCss = FONT_FAMILY_CSS[settings.fontFamily]

  const dense = perPage >= 8
  const baseQr = { small: 44, medium: 62, large: 84 }[settings.qrSize]
  const qrPx = dense ? Math.min(baseQr, 44) : baseQr
  const fontPx = (dense || tpl.compact ? 7 : 9) * k

  const hasHeader =
    !!settings.pdfTitle.trim() ||
    !!settings.pdfSubtitle.trim() ||
    !!settings.customNote.trim()

  return (
    <div className={styles.pages} style={{ fontFamily: fontCss }}>
      {pages.map((pageItems, pageIndex) => (
        <div key={pageIndex}>
          <div
            className={styles.page}
            style={{ aspectRatio: `${pw} / ${ph}`, padding: `${marginPct}%` }}
          >
            <div className={styles.gridWrap} style={{ height: '100%' }}>
              {pageIndex === 0 && hasHeader && (
                <div className={styles.header}>
                  {settings.pdfTitle.trim() && (
                    <div
                      className={styles.title}
                      style={{ fontSize: `${1.1 * k}rem` }}
                    >
                      {settings.pdfTitle}
                    </div>
                  )}
                  {settings.pdfSubtitle.trim() && (
                    <div
                      className={styles.subtitle}
                      style={{ fontSize: `${0.82 * k}rem` }}
                    >
                      {settings.pdfSubtitle}
                    </div>
                  )}
                  {settings.customNote.trim() && (
                    <div
                      className={styles.note}
                      style={{ fontSize: `${0.72 * k}rem` }}
                    >
                      {settings.customNote}
                    </div>
                  )}
                </div>
              )}

              <div
                className={styles.grid}
                style={{
                  flex: 1,
                  gridTemplateColumns: `repeat(${tpl.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${tpl.rows}, 1fr)`,
                }}
              >
                {pageItems.map((item) => (
                  <PrintableLabel
                    key={item.id}
                    item={item}
                    settings={settings}
                    qrPx={qrPx}
                    fontPx={fontPx}
                  />
                ))}
              </div>
            </div>

            <div className={styles.footer}>
              <span>{settings.footerText}</span>
              <span>
                Page {pageIndex + 1} of {allPages.length}
              </span>
            </div>
          </div>
          <div className={styles.pageLabel}>
            Page {pageIndex + 1} of {allPages.length}
          </div>
        </div>
      ))}

      {allPages.length > MAX_PREVIEW_PAGES && (
        <p className={styles.more}>
          + {allPages.length - MAX_PREVIEW_PAGES} more page(s) will be included in the
          export.
        </p>
      )}
    </div>
  )
}
