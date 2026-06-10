/* =========================================================================
   Safe localStorage wrapper.
   Falls back to an in-memory store when localStorage is unavailable
   (private mode, blocked cookies, quota errors) so the app never crashes.
   ========================================================================= */

let memoryFallback: Record<string, string> = {}
let storageAvailable: boolean | null = null

function probe(): boolean {
  if (storageAvailable !== null) return storageAvailable
  try {
    const k = '__ashqr_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    storageAvailable = true
  } catch {
    storageAvailable = false
  }
  return storageAvailable
}

/** True when persistent storage is working. UI can warn the user if not. */
export function isStorageAvailable(): boolean {
  return probe()
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = probe() ? window.localStorage.getItem(key) : memoryFallback[key]
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Returns true on success, false if the value could not be persisted. */
export function writeJSON<T>(key: string, value: T): boolean {
  const raw = JSON.stringify(value)
  if (!probe()) {
    memoryFallback[key] = raw
    return false
  }
  try {
    window.localStorage.setItem(key, raw)
    return true
  } catch {
    // Quota exceeded or similar — keep working in memory for this session.
    memoryFallback[key] = raw
    return false
  }
}
