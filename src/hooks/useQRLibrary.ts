import { useCallback } from 'react'
import type { QRFormValues, QRItem } from '../types'
import { STORAGE_KEYS } from '../constants'
import { createId } from '../utils/id'
import { useLocalStorage } from './useLocalStorage'

const clean = (value: string): string | undefined => value.trim() || undefined

/**
 * CRUD layer over the saved QR items. This is the single place that knows
 * about persistence, so a backend can replace it later without touching the UI.
 */
export function useQRLibrary() {
  const [items, setItems] = useLocalStorage<QRItem[]>(STORAGE_KEYS.items, [])

  const createItem = useCallback(
    (values: QRFormValues): QRItem => {
      const now = new Date().toISOString()
      const item: QRItem = {
        id: createId(),
        name: values.name.trim(),
        url: values.url.trim(),
        type: values.type,
        project: clean(values.project),
        area: clean(values.area),
        description: clean(values.description),
        createdAt: now,
        updatedAt: now,
      }
      setItems((prev) => [item, ...prev])
      return item
    },
    [setItems],
  )

  const updateItem = useCallback(
    (id: string, values: QRFormValues): void => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                name: values.name.trim(),
                url: values.url.trim(),
                type: values.type,
                project: clean(values.project),
                area: clean(values.area),
                description: clean(values.description),
                updatedAt: new Date().toISOString(),
              }
            : it,
        ),
      )
    },
    [setItems],
  )

  const removeItem = useCallback(
    (id: string): void => {
      setItems((prev) => prev.filter((it) => it.id !== id))
    },
    [setItems],
  )

  return { items, createItem, updateItem, removeItem }
}
