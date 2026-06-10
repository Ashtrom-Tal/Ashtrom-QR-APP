import { useCallback, useRef, useState } from 'react'
import type { ToastMessage } from '../types'
import { createId } from '../utils/id'

/** Lightweight, self-dismissing toast notifications. */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timers = useRef<Record<string, number>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current[id]
    if (timer) {
      window.clearTimeout(timer)
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (text: string, variant: ToastMessage['variant'] = 'info') => {
      const id = createId()
      setToasts((prev) => [...prev, { id, text, variant }])
      timers.current[id] = window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}
