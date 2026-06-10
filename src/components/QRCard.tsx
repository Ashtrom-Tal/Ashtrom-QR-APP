import {
  Copy,
  ExternalLink,
  Pencil,
  Printer,
  Trash2,
} from 'lucide-react'
import type { QRItem, ToastMessage } from '../types'
import { QR_TYPE_LABELS } from '../constants'
import { formatDate, sanitizeFilename, shortenUrl } from '../utils/format'
import { generateQrPngDataUrl, generateQrSvgString } from '../utils/qr'
import { downloadDataUrl, downloadText } from '../utils/download'
import { QRCodeRenderer } from './QRCodeRenderer'
import { Button } from './ui/Button'
import { Checkbox } from './ui/Checkbox'
import styles from './QRCard.module.css'

interface QRCardProps {
  item: QRItem
  selected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (item: QRItem) => void
  onDelete: (item: QRItem) => void
  onExport: (item: QRItem) => void
  onCopyUrl: (url: string) => void
  onOpenUrl: (url: string) => void
  notify: (text: string, variant?: ToastMessage['variant']) => void
}

export function QRCard({
  item,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onExport,
  onCopyUrl,
  onOpenUrl,
  notify,
}: QRCardProps) {
  const filenameBase = `qr-${sanitizeFilename(item.name)}`

  const downloadPng = async () => {
    try {
      const dataUrl = await generateQrPngDataUrl(item.url, { size: 1024, level: 'M' })
      downloadDataUrl(dataUrl, `${filenameBase}.png`)
      notify('PNG downloaded.', 'success')
    } catch {
      notify('Could not generate the PNG image.', 'error')
    }
  }

  const downloadSvg = async () => {
    try {
      const svg = await generateQrSvgString(item.url, { level: 'M' })
      downloadText(svg, `${filenameBase}.svg`, 'image/svg+xml')
      notify('SVG downloaded.', 'success')
    } catch {
      notify('Could not generate the SVG image.', 'error')
    }
  }

  return (
    <article className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <div className={styles.top}>
        <Checkbox
          label="Select"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          aria-label={`Select ${item.name}`}
        />
        <span className={styles.date}>{formatDate(item.createdAt)}</span>
      </div>

      <div className={styles.qrWrap}>
        <QRCodeRenderer value={item.url} size={150} />
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.typeChip}>{QR_TYPE_LABELS[item.type]}</span>
        </div>

        {item.project && (
          <div className={styles.metaLine}>
            <b>Project:</b> {item.project}
          </div>
        )}
        {item.area && (
          <div className={styles.metaLine}>
            <b>Area:</b> {item.area}
          </div>
        )}
        {item.description && <p className={styles.description}>{item.description}</p>}

        <div className={styles.urlBox}>
          <span className={styles.urlText} title={item.url}>
            {shortenUrl(item.url, 40)}
          </span>
          <button
            type="button"
            className={styles.copyInline}
            onClick={() => onCopyUrl(item.url)}
            aria-label="Copy URL"
            title="Copy URL"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        <Button size="sm" variant="secondary" onClick={downloadPng}>
          PNG
        </Button>
        <Button size="sm" variant="secondary" onClick={downloadSvg}>
          SVG
        </Button>
        <Button
          size="sm"
          variant="secondary"
          iconOnly
          onClick={() => onExport(item)}
          aria-label="Print / export to PDF"
          title="Print / export to PDF"
        >
          <Printer size={15} />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          iconOnly
          onClick={() => onOpenUrl(item.url)}
          aria-label="Open URL in a new tab"
          title="Open URL"
        >
          <ExternalLink size={15} />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          iconOnly
          onClick={() => onEdit(item)}
          aria-label="Edit"
          title="Edit"
        >
          <Pencil size={15} />
        </Button>
        <Button
          size="sm"
          variant="dangerGhost"
          iconOnly
          onClick={() => onDelete(item)}
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </article>
  )
}
