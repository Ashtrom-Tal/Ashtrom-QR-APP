import { useId, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  FileDown,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react'
import type {
  ExportSettings,
  FontFamily,
  LogoPosition,
  Orientation,
  PageSize,
  PdfLogo,
  QRItem,
  SizePreset,
  Template,
  ToastMessage,
  VisibleFields,
} from '../types'
import {
  ACCEPTED_LOGO_TYPES,
  FONT_OPTIONS,
  FONT_SCALE_OPTIONS,
  INNER_LOGO_WARNING,
  LOGO_POSITIONS,
  MAX_PAGE_LOGOS,
  TEMPLATES,
} from '../constants'
import { exportToPdf, type ExportAction } from '../utils/pdf'
import { Modal } from './Modal'
import { PDFPreview } from './PDFPreview'
import { Button } from './ui/Button'
import { Field } from './ui/Field'
import { Select } from './ui/Select'
import { Input } from './ui/Input'
import { TextArea } from './ui/TextArea'
import { Checkbox } from './ui/Checkbox'
import styles from './ExportModal.module.css'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      reject(new Error('Unsupported image. Please use a PNG, JPG or SVG file.'))
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error('That image is too large (max 2 MB).'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}

const SIZE_OPTIONS: { value: SizePreset; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

const FIELD_TOGGLES: { key: keyof VisibleFields; label: string }[] = [
  { key: 'name', label: 'QR name' },
  { key: 'type', label: 'Type' },
  { key: 'project', label: 'Project' },
  { key: 'area', label: 'Area / Location' },
  { key: 'description', label: 'Description' },
  { key: 'createdDate', label: 'Created date' },
]

type SettingsUpdater =
  | Partial<ExportSettings>
  | ((prev: ExportSettings) => Partial<ExportSettings>)

interface ExportModalProps {
  open: boolean
  onClose: () => void
  items: QRItem[]
  settings: ExportSettings
  onChangeSettings: (updater: SettingsUpdater) => void
  notify: (text: string, variant?: ToastMessage['variant']) => void
}

export function ExportModal({
  open,
  onClose,
  items,
  settings,
  onChangeSettings,
  notify,
}: ExportModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const logoInputs = useRef<(HTMLInputElement | null)[]>([])
  const innerLogoInput = useRef<HTMLInputElement>(null)
  const id = useId()

  const handleExport = async (action: ExportAction) => {
    setBusy(true)
    try {
      await exportToPdf(items, settings, action)
      notify(
        action === 'print' ? 'Opening the print dialog…' : 'PDF exported.',
        'success',
      )
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Export failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  /* ---------- Page logos (up to MAX_PAGE_LOGOS) ---------- */

  const updateLogoAt = (index: number, patch: Partial<PdfLogo>) => {
    onChangeSettings((prev) => {
      const logos = prev.logos.slice()
      logos[index] = { ...logos[index], ...patch }
      return { logos }
    })
  }

  const handleLogoFile = async (file: File | undefined, index: number) => {
    if (!file) return
    try {
      const dataUrl = await readImageFile(file)
      updateLogoAt(index, { dataUrl })
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Logo upload failed.', 'error')
    }
  }

  const removeLogoImage = (index: number) => {
    updateLogoAt(index, { dataUrl: undefined })
  }

  const addLogoSlot = () => {
    if (settings.logos.length >= MAX_PAGE_LOGOS) return
    const taken = new Set(settings.logos.map((l) => l.position))
    const next: LogoPosition =
      (LOGO_POSITIONS.map((p) => p.value).find((p) => !taken.has(p)) ??
        'top-right')
    onChangeSettings({ logos: [...settings.logos, { position: next }] })
  }

  const removeLogoSlot = (index: number) => {
    const logos = settings.logos.filter((_, i) => i !== index)
    onChangeSettings({ logos })
  }

  /* ---------- Inner QR logo ---------- */

  const handleInnerLogoFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await readImageFile(file)
      onChangeSettings({ innerLogoDataUrl: dataUrl, innerLogoEnabled: true })
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Logo upload failed.', 'error')
    }
  }

  const toggleField = (key: keyof VisibleFields, checked: boolean) => {
    onChangeSettings({
      visibleFields: { ...settings.visibleFields, [key]: checked },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export & print"
      subtitle={`${items.length} QR code${items.length === 1 ? '' : 's'} selected`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('print')}
            disabled={busy || items.length === 0}
          >
            <Printer size={16} /> Print
          </Button>
          <Button
            variant="primary"
            onClick={() => handleExport('save')}
            disabled={busy || items.length === 0}
          >
            <FileDown size={16} /> {busy ? 'Exporting…' : 'Export to PDF'}
          </Button>
        </>
      }
    >
      <div className={styles.layout}>
        {/* ---------------- Settings ---------------- */}
        <div className={styles.settings}>
          <section className={styles.section}>
            <span className={styles.sectionTitle}>Page layout</span>
            <div className={styles.grid2}>
              <Field label="Page size" htmlFor={`${id}-page`}>
                <Select
                  id={`${id}-page`}
                  value={settings.pageSize}
                  onChange={(e) =>
                    onChangeSettings({ pageSize: e.target.value as PageSize })
                  }
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </Select>
              </Field>
              <Field label="Orientation" htmlFor={`${id}-orient`}>
                <Select
                  id={`${id}-orient`}
                  value={settings.orientation}
                  onChange={(e) =>
                    onChangeSettings({ orientation: e.target.value as Orientation })
                  }
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </Select>
              </Field>
            </div>
            <Field label="Template" htmlFor={`${id}-tpl`}>
              <Select
                id={`${id}-tpl`}
                value={settings.template}
                onChange={(e) =>
                  onChangeSettings({ template: e.target.value as Template })
                }
              >
                {TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className={styles.grid2}>
              <Field label="QR size" htmlFor={`${id}-qrsize`}>
                <Select
                  id={`${id}-qrsize`}
                  value={settings.qrSize}
                  onChange={(e) =>
                    onChangeSettings({ qrSize: e.target.value as SizePreset })
                  }
                >
                  {SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Margins" htmlFor={`${id}-margin`}>
                <Select
                  id={`${id}-margin`}
                  value={settings.margin}
                  onChange={(e) =>
                    onChangeSettings({ margin: e.target.value as SizePreset })
                  }
                >
                  {SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <section className={styles.section}>
            <span className={styles.sectionTitle}>Typography</span>
            <div className={styles.grid2}>
              <Field label="Font" htmlFor={`${id}-font`}>
                <Select
                  id={`${id}-font`}
                  value={settings.fontFamily}
                  onChange={(e) =>
                    onChangeSettings({ fontFamily: e.target.value as FontFamily })
                  }
                >
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Text size" htmlFor={`${id}-fontscale`}>
                <Select
                  id={`${id}-fontscale`}
                  value={settings.fontScale}
                  onChange={(e) =>
                    onChangeSettings({ fontScale: e.target.value as SizePreset })
                  }
                >
                  {FONT_SCALE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            Advanced options
            <ChevronDown
              size={18}
              className={`${styles.chevron} ${
                showAdvanced ? styles.chevronOpen : ''
              }`}
            />
          </button>

          {showAdvanced && (
            <div className={styles.advancedBody}>
              <section className={styles.section}>
                <span className={styles.sectionTitle}>Label fields</span>
                <div className={styles.fieldsGrid}>
                  {FIELD_TOGGLES.map((f) => (
                    <Checkbox
                      key={f.key}
                      label={f.label}
                      checked={settings.visibleFields[f.key]}
                      onChange={(e) => toggleField(f.key, e.target.checked)}
                    />
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <span className={styles.sectionTitle}>Export text</span>
                <Field label="PDF title" htmlFor={`${id}-title`}>
                  <Input
                    id={`${id}-title`}
                    value={settings.pdfTitle}
                    placeholder="e.g. Tower B — Site QR Codes"
                    onChange={(e) => onChangeSettings({ pdfTitle: e.target.value })}
                  />
                </Field>
                <Field label="PDF subtitle" htmlFor={`${id}-subtitle`}>
                  <Input
                    id={`${id}-subtitle`}
                    value={settings.pdfSubtitle}
                    placeholder="Optional"
                    onChange={(e) =>
                      onChangeSettings({ pdfSubtitle: e.target.value })
                    }
                  />
                </Field>
                <Field label="Custom note" htmlFor={`${id}-note`}>
                  <TextArea
                    id={`${id}-note`}
                    value={settings.customNote}
                    rows={2}
                    placeholder="Shown under the title on the first page"
                    onChange={(e) => onChangeSettings({ customNote: e.target.value })}
                  />
                </Field>
                <Field label="Footer text" htmlFor={`${id}-footer`}>
                  <Input
                    id={`${id}-footer`}
                    value={settings.footerText}
                    placeholder="Shown at the bottom of every page"
                    onChange={(e) => onChangeSettings({ footerText: e.target.value })}
                  />
                </Field>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>
                    Page logos (up to {MAX_PAGE_LOGOS})
                  </span>
                  {settings.logos.length < MAX_PAGE_LOGOS && (
                    <Button size="sm" variant="ghost" onClick={addLogoSlot}>
                      + Add logo
                    </Button>
                  )}
                </div>
                <p className={styles.helper}>
                  Place each logo in a different corner — e.g. company logo top-left
                  and project logo top-right.
                </p>

                {settings.logos.map((logo, index) => (
                  <div key={index} className={styles.logoCard}>
                    <div className={styles.logoCardHeader}>
                      <span className={styles.logoCardTitle}>Logo {index + 1}</span>
                      <Button
                        size="sm"
                        variant="dangerGhost"
                        iconOnly
                        aria-label={`Remove logo ${index + 1}`}
                        onClick={() => removeLogoSlot(index)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>

                    <div className={styles.logoRow}>
                      <input
                        ref={(el) => {
                          logoInputs.current[index] = el
                        }}
                        type="file"
                        accept={ACCEPTED_LOGO_TYPES}
                        className={styles.hiddenInput}
                        onChange={(e) => {
                          void handleLogoFile(e.target.files?.[0], index)
                          e.target.value = ''
                        }}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => logoInputs.current[index]?.click()}
                      >
                        <Upload size={15} />{' '}
                        {logo.dataUrl ? 'Replace' : 'Upload image'}
                      </Button>
                      {logo.dataUrl && (
                        <>
                          <img
                            className={styles.logoThumb}
                            src={logo.dataUrl}
                            alt={`Logo ${index + 1} preview`}
                          />
                          <Button
                            size="sm"
                            variant="dangerGhost"
                            iconOnly
                            aria-label={`Remove logo ${index + 1} image`}
                            onClick={() => removeLogoImage(index)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </>
                      )}
                    </div>

                    <Field
                      label="Position"
                      htmlFor={`${id}-logopos-${index}`}
                    >
                      <Select
                        id={`${id}-logopos-${index}`}
                        value={logo.position}
                        onChange={(e) =>
                          updateLogoAt(index, {
                            position: e.target.value as LogoPosition,
                          })
                        }
                      >
                        {LOGO_POSITIONS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ))}

                {settings.logos.length === 0 && (
                  <Button size="sm" variant="secondary" onClick={addLogoSlot}>
                    + Add a logo
                  </Button>
                )}
              </section>

              <section className={styles.section}>
                <span className={styles.sectionTitle}>Logo inside the QR code</span>
                <Checkbox
                  label="Embed a small logo in the centre of each QR"
                  checked={settings.innerLogoEnabled}
                  onChange={(e) =>
                    onChangeSettings({ innerLogoEnabled: e.target.checked })
                  }
                />
                {settings.innerLogoEnabled && (
                  <>
                    <div className={styles.warning}>
                      <AlertTriangle size={15} />
                      {INNER_LOGO_WARNING}
                    </div>
                    <div className={styles.logoRow}>
                      <input
                        ref={innerLogoInput}
                        type="file"
                        accept={ACCEPTED_LOGO_TYPES}
                        className={styles.hiddenInput}
                        onChange={(e) => {
                          void handleInnerLogoFile(e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => innerLogoInput.current?.click()}
                      >
                        <Upload size={15} /> Upload QR logo
                      </Button>
                      {settings.innerLogoDataUrl && (
                        <>
                          <img
                            className={styles.logoThumb}
                            src={settings.innerLogoDataUrl}
                            alt="QR logo preview"
                          />
                          <Button
                            size="sm"
                            variant="dangerGhost"
                            iconOnly
                            aria-label="Remove QR logo"
                            onClick={() =>
                              onChangeSettings({ innerLogoDataUrl: undefined })
                            }
                          >
                            <Trash2 size={15} />
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </div>

        {/* ---------------- Live preview ---------------- */}
        <div className={styles.previewPane}>
          <div className={styles.previewSticky}>
            <div className={styles.previewLabel}>Live preview</div>
            <div className={styles.previewBox}>
              <PDFPreview items={items} settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
