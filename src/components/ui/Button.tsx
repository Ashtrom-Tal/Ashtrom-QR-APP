import type { ButtonHTMLAttributes } from 'react'
import styles from './ui.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconOnly?: boolean
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  iconOnly = false,
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[variant],
    size === 'sm' ? styles.sizeSm : styles.sizeMd,
    iconOnly && styles.iconOnly,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button type={type} className={cls} {...rest} />
}
