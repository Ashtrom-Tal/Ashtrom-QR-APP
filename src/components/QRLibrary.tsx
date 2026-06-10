import { QrCode, SearchX } from 'lucide-react'
import type { QRItem, ToastMessage } from '../types'
import { QRCard } from './QRCard'
import { EmptyState } from './EmptyState'
import styles from './QRLibrary.module.css'

interface QRLibraryProps {
  items: QRItem[]
  totalCount: number
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onEdit: (item: QRItem) => void
  onDelete: (item: QRItem) => void
  onExport: (item: QRItem) => void
  onCopyUrl: (url: string) => void
  onOpenUrl: (url: string) => void
  notify: (text: string, variant?: ToastMessage['variant']) => void
}

export function QRLibrary({
  items,
  totalCount,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onExport,
  onCopyUrl,
  onOpenUrl,
  notify,
}: QRLibraryProps) {
  if (totalCount === 0) {
    return (
      <EmptyState
        icon={QrCode}
        title="No QR codes yet"
        description="Paste a public link in the form above to create your first QR code. It will be saved here in your browser."
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No matches"
        description="No saved QR codes match your search or filter. Try a different keyword or clear the filter."
      />
    )
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <QRCard
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onExport={onExport}
          onCopyUrl={onCopyUrl}
          onOpenUrl={onOpenUrl}
          notify={notify}
        />
      ))}
    </div>
  )
}
