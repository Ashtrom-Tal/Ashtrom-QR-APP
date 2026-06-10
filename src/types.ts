/* =========================================================================
   Ash QR — shared domain types.
   Centralised so future features (backend, auth, analytics) can extend them.
   ========================================================================= */

export type QRType = 'folder' | 'file' | 'website' | 'youtube' | 'other'

/** A single saved QR code item. */
export interface QRItem {
  id: string
  name: string
  url: string
  type: QRType
  project?: string
  area?: string
  description?: string
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

/** Shape of the create/edit form before it becomes a QRItem. */
export interface QRFormValues {
  name: string
  url: string
  type: QRType
  project: string
  area: string
  description: string
}

/* ---------- PDF / label export ---------- */

export type PageSize = 'a4' | 'letter'
export type Orientation = 'portrait' | 'landscape'
export type Template = 'single' | '2up' | '4up' | '6up' | '8up' | 'compact'
export type SizePreset = 'small' | 'medium' | 'large'

export type LogoPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/** Built-in jsPDF fonts that we expose to the user. */
export type FontFamily = 'helvetica' | 'times' | 'courier'

/** One uploaded page logo. Position is persisted; dataUrl is per-session. */
export interface PdfLogo {
  position: LogoPosition
  dataUrl?: string
}

/** Which QR fields are printed on each label. */
export interface VisibleFields {
  name: boolean
  project: boolean
  area: boolean
  type: boolean
  description: boolean
  createdDate: boolean
}

/**
 * Export configuration. The structural part (page size, template, fonts,
 * logo positions, …) is persisted to localStorage; the free-text part and
 * uploaded logo images are intentionally transient per session.
 */
export interface ExportSettings {
  pageSize: PageSize
  orientation: Orientation
  template: Template
  margin: SizePreset
  qrSize: SizePreset
  visibleFields: VisibleFields

  /* Typography */
  fontFamily: FontFamily
  fontScale: SizePreset

  /* Up to two logos placed on the PDF page (each with its own position) */
  logos: PdfLogo[]

  /* Small logo embedded in the centre of each QR code */
  innerLogoEnabled: boolean
  innerLogoDataUrl?: string

  /* Export-specific text — never written back to the QR items */
  pdfTitle: string
  pdfSubtitle: string
  customNote: string
  footerText: string
}

/** The subset of ExportSettings that is remembered between sessions. */
export interface PersistedExportSettings {
  pageSize: PageSize
  orientation: Orientation
  template: Template
  margin: SizePreset
  qrSize: SizePreset
  visibleFields: VisibleFields
  fontFamily: FontFamily
  fontScale: SizePreset
  /** Only positions are persisted, not data URLs. */
  logoPositions: LogoPosition[]
  innerLogoEnabled: boolean
}

/* ---------- UI ---------- */

export type TypeFilter = 'all' | QRType

export interface ToastMessage {
  id: string
  text: string
  variant: 'success' | 'error' | 'info'
}
