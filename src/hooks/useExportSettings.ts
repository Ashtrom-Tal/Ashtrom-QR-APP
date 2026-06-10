import { useCallback, useState } from 'react'
import type { ExportSettings, PersistedExportSettings, PdfLogo } from '../types'
import { DEFAULT_EXPORT_SETTINGS, MAX_PAGE_LOGOS, STORAGE_KEYS } from '../constants'
import { readJSON, writeJSON } from '../utils/storage'

type Updater = Partial<ExportSettings> | ((prev: ExportSettings) => Partial<ExportSettings>)

/** Persisted shape for uploaded logo images (data URLs). */
interface PersistedLogoAssets {
  pageLogos: (string | undefined)[]
  innerLogo?: string
}

/** Skip persisting images if combined payload would blow the quota. */
const MAX_PERSISTED_ASSETS_BYTES = 1.5 * 1024 * 1024

function withinQuota(assets: PersistedLogoAssets): boolean {
  let total = 0
  for (const a of assets.pageLogos) total += a?.length ?? 0
  total += assets.innerLogo?.length ?? 0
  return total <= MAX_PERSISTED_ASSETS_BYTES
}

/**
 * Holds the full export settings in memory but persists:
 *   - the structural subset (page size, template, fields, fonts, logo positions)
 *   - uploaded logo images (data URLs) under a separate key, gated by size
 * Free-text fields (title, note, footer) are intentionally transient per session.
 */
export function useExportSettings() {
  const [settings, setSettings] = useState<ExportSettings>(() => {
    const persisted = readJSON<Partial<PersistedExportSettings>>(
      STORAGE_KEYS.exportSettings,
      {},
    )
    const assets = readJSON<PersistedLogoAssets>(STORAGE_KEYS.logoAssets, {
      pageLogos: [],
    })

    const positions =
      persisted.logoPositions && persisted.logoPositions.length
        ? persisted.logoPositions.slice(0, MAX_PAGE_LOGOS)
        : DEFAULT_EXPORT_SETTINGS.logos.map((l) => l.position)
    const logos: PdfLogo[] = positions.map((p, i) => ({
      position: p,
      dataUrl: assets.pageLogos[i],
    }))

    return {
      ...DEFAULT_EXPORT_SETTINGS,
      ...persisted,
      visibleFields: {
        ...DEFAULT_EXPORT_SETTINGS.visibleFields,
        ...(persisted.visibleFields ?? {}),
      },
      logos,
      innerLogoDataUrl: assets.innerLogo,
    }
  })

  const update = useCallback((updater: Updater) => {
    setSettings((prev) => {
      const patch = typeof updater === 'function' ? updater(prev) : updater
      const next = { ...prev, ...patch }

      const toSave: PersistedExportSettings = {
        pageSize: next.pageSize,
        orientation: next.orientation,
        template: next.template,
        margin: next.margin,
        qrSize: next.qrSize,
        visibleFields: next.visibleFields,
        fontFamily: next.fontFamily,
        fontScale: next.fontScale,
        logoPositions: next.logos.map((l) => l.position),
        innerLogoEnabled: next.innerLogoEnabled,
      }
      writeJSON(STORAGE_KEYS.exportSettings, toSave)

      const assets: PersistedLogoAssets = {
        pageLogos: next.logos.map((l) => l.dataUrl),
        innerLogo: next.innerLogoDataUrl,
      }
      if (withinQuota(assets)) {
        writeJSON(STORAGE_KEYS.logoAssets, assets)
      }

      return next
    })
  }, [])

  return { settings, update }
}
