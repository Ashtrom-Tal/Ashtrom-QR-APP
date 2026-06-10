import type { CSSProperties } from 'react'
import type { ExportSettings, LogoPosition, QRItem } from '../types'
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

function logoCornerStyle(position: LogoPosition): CSSProperties {
  const s: CSSProperties = { position: 'absolute' }
  if (position.startsWith('top')) s.top = '6px'
  else s.bottom = '6px'
  if (position.endsWith('left')) s.left = '6px'
  else if (position.endsWith('right')) s.right = '6px'
  else {
    s.left = '50%'
    s.transform = 'translateX(-50%)'
  }
  return s
}

/** One label as it will appear on the page — used in the live PDF preview. */
export function PrintableLabel({ item, settings, qrPx, fontPx = 9 }: PrintableLabelProps) {
  const f = settings.visibleFields
  const innerLogo = settings.innerLogoEnabled ? settings.innerLogoDataUrl : undefined
  const level = qrLevelFor(settings.innerLogoEnabled && !!settings.innerLogoDataUrl)

  const visibleLogos = settings.logos.filter((l) => !!l.dataUrl)
  const hasTopLogo = visibleLogos.some((l) => l.position.startsWith('top'))
  const hasBottomLogo = visibleLogos.some((l) => l.position.startsWith('bottom'))

  return (
    <div className={styles.label}>
      {visibleLogos.map((logo, i) => (
        <img
          key={i}
          className={styles.cellLogo}
          src={logo.dataUrl}
          alt=""
          style={logoCornerStyle(logo.position)}
        />
      ))}

      <div
        className={styles.body}
        style={{
          paddingTop: hasTopLogo ? '18px' : undefined,
          paddingBottom: hasBottomLogo ? '18px' : undefined,
        }}
      >
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
    </div>
  )
}
