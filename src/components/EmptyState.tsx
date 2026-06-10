import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconCircle}>
        <Icon size={28} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
