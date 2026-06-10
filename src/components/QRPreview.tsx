import { Copy, ExternalLink } from 'lucide-react'
import type { QRFormValues } from '../types'
import { QR_TYPE_LABELS } from '../constants'
import { validateUrl } from '../utils/validation'
import { getYouTubeId } from '../utils/youtube'
import { QRCodeRenderer } from './QRCodeRenderer'
import { YouTubeEmbed } from './YouTubeEmbed'
import { Button } from './ui/Button'
import styles from './QRPreview.module.css'

interface QRPreviewProps {
  values: QRFormValues
  onCopyUrl: (url: string) => void
  onOpenUrl: (url: string) => void
}

export function QRPreview({ values, onCopyUrl, onOpenUrl }: QRPreviewProps) {
  const url = values.url.trim()
  const isValid = url.length > 0 && !validateUrl(url)
  const youTubeId = values.type === 'youtube' || values.type === 'other' ? getYouTubeId(url) : null

  return (
    <div className={styles.wrap}>
      <div className={styles.qrFrame}>
        <QRCodeRenderer value={isValid ? url : ''} size={232} />
      </div>

      <div>
        <h3 className={styles.name}>
          {values.name.trim() || <span className={styles.muted}>Untitled QR</span>}
        </h3>
      </div>

      <span className={styles.typeChip}>{QR_TYPE_LABELS[values.type]}</span>

      <div className={styles.meta}>
        {values.project.trim() && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Project:</span>
            <span>{values.project}</span>
          </div>
        )}
        {values.area.trim() && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Area:</span>
            <span>{values.area}</span>
          </div>
        )}
      </div>

      {values.description.trim() && (
        <p className={styles.description}>{values.description}</p>
      )}

      {youTubeId && (
        <div className={styles.embed}>
          <YouTubeEmbed videoId={youTubeId} title={values.name || 'YouTube preview'} />
        </div>
      )}

      {isValid && (
        <>
          <div className={styles.urlBox}>
            <span className={styles.urlText} title={url}>
              {url}
            </span>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" onClick={() => onCopyUrl(url)}>
              <Copy size={15} /> Copy URL
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onOpenUrl(url)}>
              <ExternalLink size={15} /> Open
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
