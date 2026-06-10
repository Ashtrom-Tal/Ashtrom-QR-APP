import type { SelectHTMLAttributes } from 'react'
import styles from './ui.module.css'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={[styles.control, styles.select, className]
        .filter(Boolean)
        .join(' ')}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  )
}
