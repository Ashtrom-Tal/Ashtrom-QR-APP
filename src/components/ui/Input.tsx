import type { InputHTMLAttributes } from 'react'
import styles from './ui.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      className={[styles.control, className].filter(Boolean).join(' ')}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}
