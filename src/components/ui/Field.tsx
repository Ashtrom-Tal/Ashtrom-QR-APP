import type { ReactNode } from 'react'
import styles from './ui.module.css'

interface FieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: ReactNode
  children: ReactNode
}

/** Label + optional hint + accessible error message wrapper for a control. */
export function Field({ label, htmlFor, required, error, hint, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
