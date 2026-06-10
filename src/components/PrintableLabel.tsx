import type { ExportSettings, QRItem } from '../types'
import { QR_TYPE_LABELS } from '../constants'
import { formatDate } from '../utils/format'
import { qrLevelFor } from '../utils/qr'
import { QRCodeRenderer } from './QRCodeRenderer'
import styles from './PrintableLabel.module.css'

interface PrintableLabelProps {
  item: QRItem
  settings: ExportSettings
  qrPx: number
  fontPx?: number
}

/** One label as it will appear on the page — used in the live PDF preview. */
export function PrintableLabel({ item, settings, qrPx, fontPx = 9 }: PrintableLabelProps) {
  const f = settings.visibleFields
  const innerLogo = settings.innerLogoEnabled ? settings.innerLogoDataUrl : undefined
  const level = qrLevelFor(settings.innerLogoEnabled && !!settings.innerLogoDataUrl)

  return (
    <div className={styles.label}>
      <div className={styles.qr}>
        <QRCodeRenderer value={item.url} size={qrPx} level={level} logoDataUrl={innerLogo} />
      </div>
      {f.name && (
        <div className={styles.name} style={{ fontSize: fontPx + 1 }}>
          {item.name}
        </div>
      )}
      {f.type && (
        <div className={styles.line} style={{ fontSize: fontPx - 1 }}>
          {QR_TYPE_LABELS[item.type]}
        </div>
      )}
      {f.project && item.project && (
        <div className={styles.line} style={{ fontSize: fontPx - 1 }}>
          {item.project}
        </div>
      )}
      {f.area && item.area && (
        <div className={styles.line} style={{ fontSize: fontPx - 1 }}>
          {item.area}
        </div>
      )}
      {f.description && item.description && (
        <div
          className={`${styles.line} ${styles.desc}`}
          style={{ fontSize: fontPx - 1 }}
        >
          {item.description}
        </div>
      )}
      {f.createdDate && (
        <div className={styles.line} style={{ fontSize: fontPx - 2 }}>
          {formatDate(item.createdAt)}
        </div>
      )}
    </div>
  )
}
