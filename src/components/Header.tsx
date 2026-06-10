import { QrCode } from 'lucide-react'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.logo} aria-hidden="true">
          <QrCode size={24} />
        </div>
        <div className={styles.titles}>
          <span className={styles.name}>Ash QR</span>
          <span className={styles.subtitle}>
            QR codes for construction &amp; BIM project documentation
          </span>
        </div>
        <span className={styles.badge}>Local · No sign-in</span>
      </div>
    </header>
  )
}
