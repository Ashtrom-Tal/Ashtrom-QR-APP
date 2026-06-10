import { useEffect, useRef, useState } from 'react'
import { renderQrToCanvas, type ErrorLevel } from '../utils/qr'
import styles from './QRCodeRenderer.module.css'

interface QRCodeRendererProps {
  value: string
  size?: number
  level?: ErrorLevel
  logoDataUrl?: string
  className?: string
}

/** Live, crisp QR preview drawn to a canvas. Handles empty / error states. */
export function QRCodeRenderer({
  value,
  size = 200,
  level = 'M',
  logoDataUrl,
  className,
}: QRCodeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return
    let active = true
    setFailed(false)
    renderQrToCanvas(canvas, value, { size, level, logoDataUrl }).catch(() => {
      if (active) setFailed(true)
    })
    return () => {
      active = false
    }
  }, [value, size, level, logoDataUrl])

  if (!value) {
    return (
      <div className={styles.placeholder} style={{ width: size, height: size }}>
        Your QR code will appear here
      </div>
    )
  }

  if (failed) {
    return (
      <div className={styles.error} style={{ width: size, height: size }}>
        Could not generate this QR code.
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={[styles.canvas, className].filter(Boolean).join(' ')}
      role="img"
      aria-label="Generated QR code"
    />
  )
}
