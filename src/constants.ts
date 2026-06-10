/* =========================================================================
   Ash QR — static configuration: QR types, templates, page sizes, defaults.
   Keeping these in one place makes the app easy to extend later.
   ========================================================================= */

import type {
  ExportSettings,
  FontFamily,
  LogoPosition,
  PageSize,
  QRType,
  SizePreset,
  Template,
  TypeFilter,
} from './types'

/* ---------- localStorage keys ---------- */
export const STORAGE_KEYS = {
  items: 'ashqr:items',
  exportSettings: 'ashqr:exportSettings',
  logoAssets: 'ashqr:logoAssets',
} as const

/* ---------- QR types ---------- */
export const QR_TYPES: { value: QRType; label: string }[] = [
  { value: 'folder', label: 'Folder' },
  { value: 'file', label: 'File' },
  { value: 'website', label: 'Website' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Other' },
]

export const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...QR_TYPES,
]

export const QR_TYPE_LABELS: Record<QRType, string> = QR_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {} as Record<QRType, string>,
)

/* ---------- Helper text ---------- */
export const PUBLIC_LINK_REMINDER =
  'Make sure the link is public or accessible to anyone who scans the QR code. Test it in an incognito window before printing.'

export const INNER_LOGO_WARNING =
  'Adding a logo inside the QR code may reduce scan reliability. Test before printing.'

/* ---------- Page geometry (millimetres) ---------- */
export const PAGE_SIZES_MM: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
}

export const MARGIN_MM: Record<SizePreset, number> = {
  small: 8,
  medium: 14,
  large: 20,
}

/** Target QR edge length in millimetres per preset (clamped to fit cell). */
export const QR_SIZE_MM: Record<SizePreset, number> = {
  small: 24,
  medium: 36,
  large: 52,
}

/* ---------- Templates: grid columns x rows per page ---------- */
export const TEMPLATES: {
  value: Template
  label: string
  cols: number
  rows: number
  /** compact uses tighter text / smaller fonts */
  compact?: boolean
}[] = [
  { value: 'single', label: 'Single large label', cols: 1, rows: 1 },
  { value: '2up', label: '2 per page', cols: 1, rows: 2 },
  { value: '4up', label: '4 per page', cols: 2, rows: 2 },
  { value: '6up', label: '6 per page', cols: 2, rows: 3 },
  { value: '8up', label: '8 per page', cols: 2, rows: 4 },
  { value: 'compact', label: 'Compact grid', cols: 3, rows: 5, compact: true },
]

export const TEMPLATE_MAP = TEMPLATES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t }),
  {} as Record<Template, (typeof TEMPLATES)[number]>,
)

export const LOGO_POSITIONS: { value: LogoPosition; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
]

/** Up to this many logos can be placed on a single PDF page. */
export const MAX_PAGE_LOGOS = 2

export const ACCEPTED_LOGO_TYPES = 'image/png,image/jpeg,image/svg+xml'

/* ---------- Typography ---------- */

/** Available fonts. CSS family is used for the live preview. */
export const FONT_OPTIONS: {
  value: FontFamily
  label: string
  css: string
}[] = [
  { value: 'helvetica', label: 'Helvetica (modern sans)', css: 'Helvetica, Arial, sans-serif' },
  { value: 'times', label: 'Times (classic serif)', css: '"Times New Roman", Times, serif' },
  { value: 'courier', label: 'Courier (monospace)', css: '"Courier New", Courier, monospace' },
  { value: 'heebo', label: 'Heebo (Hebrew + Latin)', css: 'Heebo, Arial, sans-serif' },
]

export const FONT_FAMILY_CSS: Record<FontFamily, string> = FONT_OPTIONS.reduce(
  (acc, f) => ({ ...acc, [f.value]: f.css }),
  {} as Record<FontFamily, string>,
)

/** Multiplier applied to all label/header text sizes. */
export const FONT_SCALE_FACTOR: Record<SizePreset, number> = {
  small: 0.85,
  medium: 1,
  large: 1.18,
}

export const FONT_SCALE_OPTIONS: { value: SizePreset; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

/* ---------- Defaults ---------- */
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  pageSize: 'a4',
  orientation: 'portrait',
  template: '4up',
  margin: 'medium',
  qrSize: 'medium',
  visibleFields: {
    name: true,
    project: true,
    area: true,
    type: false,
    description: false,
    createdDate: false,
  },
  fontFamily: 'helvetica',
  fontScale: 'medium',
  logos: [
    { position: 'top-left' },
    { position: 'top-right' },
  ],
  innerLogoEnabled: false,
  innerLogoDataUrl: undefined,
  pdfTitle: '',
  pdfSubtitle: '',
  customNote: '',
  footerText: '',
}
