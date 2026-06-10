import type { InputHTMLAttributes } from 'react'
import styles from './ui.module.css'

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={[styles.checkbox, className].filter(Boolean).join(' ')}>
      <input type="checkbox" className={styles.checkboxInput} {...rest} />
      <span>{label}</span>
    </label>
  )
}
