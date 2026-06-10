import type { TextareaHTMLAttributes } from 'react'
import styles from './ui.module.css'

export function TextArea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[styles.control, styles.textarea, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )
}
