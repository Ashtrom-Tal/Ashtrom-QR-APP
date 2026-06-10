import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import type { ToastMessage } from '../types'
import styles from './Toast.module.css'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className={styles.region} role="region" aria-label="Notifications">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant]
        return (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.variant]}`}
            role="status"
          >
            <Icon size={18} className={styles.icon} />
            <span className={styles.text}>{t.text}</span>
            <button
              type="button"
              className={styles.close}
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
