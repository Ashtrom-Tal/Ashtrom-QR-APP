/* URL and form validation with friendly, specific messages. */

import type { QRFormValues } from '../types'

export interface FieldErrors {
  name?: string
  url?: string
}

/** Returns an error message, or undefined when the URL is valid. */
export function validateUrl(raw: string): string | undefined {
  const value = raw.trim()
  if (!value) return 'Please enter a URL.'

  if (!/^https?:\/\//i.test(value)) {
    return 'The URL must start with http:// or https://'
  }

  try {
    const u = new URL(value)
    if (!u.hostname || !u.hostname.includes('.')) {
      return 'That doesn’t look like a valid web address.'
    }
  } catch {
    return 'That doesn’t look like a valid URL.'
  }

  return undefined
}

export function validateName(raw: string): string | undefined {
  if (!raw.trim()) return 'Please give this QR code a name.'
  return undefined
}

/** Validate the whole form. Empty object means it is valid. */
export function validateForm(values: QRFormValues): FieldErrors {
  const errors: FieldErrors = {}
  const nameError = validateName(values.name)
  const urlError = validateUrl(values.url)
  if (nameError) errors.name = nameError
  if (urlError) errors.url = urlError
  return errors
}
