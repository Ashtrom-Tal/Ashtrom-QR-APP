import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { QRFormValues, QRItem, TypeFilter } from './types'
import { QR_TYPE_LABELS } from './constants'
import { isStorageAvailable } from './utils/storage'
import { copyToClipboard, openInNewTab } from './utils/download'
import { useQRLibrary } from './hooks/useQRLibrary'
import { useExportSettings } from './hooks/useExportSettings'
import { useToast } from './hooks/useToast'
import { Header } from './components/Header'
import { QRForm } from './components/QRForm'
import { QRPreview } from './components/QRPreview'
import { SearchAndFilters } from './components/SearchAndFilters'
import { QRLibrary } from './components/QRLibrary'
import { ExportModal } from './components/ExportModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ToastContainer } from './components/Toast'
import styles from './App.module.css'

const EMPTY_FORM: QRFormValues = {
  name: '',
  url: '',
  type: 'website',
  project: '',
  area: '',
  description: '',
}

function matchesSearch(item: QRItem, query: string): boolean {
  if (!query) return true
  const haystack = [
    item.name,
    item.url,
    item.project,
    item.area,
    item.description,
    QR_TYPE_LABELS[item.type],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export default function App() {
  const { items, createItem, updateItem, removeItem } = useQRLibrary()
  const { settings, update: updateSettings } = useExportSettings()
  const { toasts, push, dismiss } = useToast()

  const [formValues, setFormValues] = useState<QRFormValues>(EMPTY_FORM)
  const [editingItem, setEditingItem] = useState<QRItem | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [exportItems, setExportItems] = useState<QRItem[]>([])
  const [exportOpen, setExportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<QRItem | null>(null)

  const storageOk = useMemo(() => isStorageAvailable(), [])

  const notify = push
  const onFormChange = useCallback((values: QRFormValues) => setFormValues(values), [])

  /* ---------- Filtering ---------- */
  const filteredItems = useMemo(
    () =>
      items.filter(
        (it) =>
          (typeFilter === 'all' || it.type === typeFilter) &&
          matchesSearch(it, search),
      ),
    [items, search, typeFilter],
  )

  const selectedItems = useMemo(
    () => items.filter((it) => selectedIds.has(it.id)),
    [items, selectedIds],
  )

  /* ---------- Form submit ---------- */
  const handleSubmit = useCallback(
    (values: QRFormValues) => {
      if (editingItem) {
        updateItem(editingItem.id, values)
        setEditingItem(null)
        setFormValues(EMPTY_FORM)
        notify('QR code updated.', 'success')
      } else {
        createItem(values)
        notify('QR code created and saved.', 'success')
      }
    },
    [editingItem, updateItem, createItem, notify],
  )

  const handleEdit = useCallback((item: QRItem) => {
    setEditingItem(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null)
    setFormValues(EMPTY_FORM)
  }, [])

  /* ---------- Delete ---------- */
  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    removeItem(deleteTarget.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    if (editingItem?.id === deleteTarget.id) {
      setEditingItem(null)
      setFormValues(EMPTY_FORM)
    }
    notify('QR code deleted.', 'info')
  }, [deleteTarget, removeItem, editingItem, notify])

  /* ---------- Selection ---------- */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredItems.map((it) => it.id)))
  }, [filteredItems])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  /* ---------- Export ---------- */
  const openExport = useCallback((toExport: QRItem[]) => {
    if (toExport.length === 0) return
    setExportItems(toExport)
    setExportOpen(true)
  }, [])

  const handleExportSelected = useCallback(() => {
    openExport(selectedItems)
  }, [openExport, selectedItems])

  const handleExportSingle = useCallback(
    (item: QRItem) => openExport([item]),
    [openExport],
  )

  /* ---------- URL helpers ---------- */
  const handleCopyUrl = useCallback(
    async (url: string) => {
      const ok = await copyToClipboard(url)
      notify(ok ? 'URL copied to clipboard.' : 'Could not copy the URL.', ok ? 'success' : 'error')
    },
    [notify],
  )

  const handleOpenUrl = useCallback((url: string) => openInNewTab(url), [])

  return (
    <div className="app-shell">
      <Header />

      <main className={`container ${styles.main}`}>
        {!storageOk && (
          <div className={styles.banner} role="alert">
            <AlertTriangle size={18} />
            <span>
              Local storage is not available in this browser, so your QR codes
              won’t be saved after you close this tab. You can still create,
              download and export them in this session.
            </span>
          </div>
        )}

        <section className={styles.hero}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              {editingItem ? 'Edit QR code' : 'Create a QR code'}
            </h2>
            <QRForm
              editingItem={editingItem}
              onSubmit={handleSubmit}
              onChange={onFormChange}
              onCancelEdit={handleCancelEdit}
            />
          </div>

          <div className={`${styles.card} ${styles.previewCard}`}>
            <h2 className={styles.cardTitle}>Preview</h2>
            <QRPreview
              values={formValues}
              onCopyUrl={handleCopyUrl}
              onOpenUrl={handleOpenUrl}
            />
          </div>
        </section>

        <section className={styles.librarySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Saved QR codes</h2>
            <span className={styles.sectionCount}>
              {items.length} total
            </span>
          </div>

          <SearchAndFilters
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            filteredCount={filteredItems.length}
            selectedCount={selectedItems.length}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onExportSelected={handleExportSelected}
          />

          <QRLibrary
            items={filteredItems}
            totalCount={items.length}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onExport={handleExportSingle}
            onCopyUrl={handleCopyUrl}
            onOpenUrl={handleOpenUrl}
            notify={notify}
          />
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          Ash QR · Your QR codes are stored only in this browser. No accounts, no
          servers, no cloud integration.
        </div>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        items={exportItems}
        settings={settings}
        onChangeSettings={updateSettings}
        notify={notify}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete QR code?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed from this browser. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
