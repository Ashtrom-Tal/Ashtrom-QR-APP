import { CheckSquare, FileDown, Search, XSquare } from 'lucide-react'
import type { TypeFilter } from '../types'
import { TYPE_FILTERS } from '../constants'
import { Button } from './ui/Button'
import styles from './SearchAndFilters.module.css'

interface SearchAndFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  typeFilter: TypeFilter
  onTypeFilterChange: (value: TypeFilter) => void
  filteredCount: number
  selectedCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onExportSelected: () => void
}

export function SearchAndFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  filteredCount,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onExportSelected,
}: SearchAndFiltersProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.searchBox}>
          <Search size={17} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="search"
            value={search}
            placeholder="Search by name, project, area, type, description or URL…"
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search saved QR codes"
          />
        </div>

        <div className={styles.filters} role="group" aria-label="Filter by type">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.chip} ${
                typeFilter === f.value ? styles.chipActive : ''
              }`}
              aria-pressed={typeFilter === f.value}
              onClick={() => onTypeFilterChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.selectionBar}>
        <span className={styles.count}>
          <b>{selectedCount}</b> selected · {filteredCount} shown
        </span>
        <div className={styles.spacer} />
        <Button
          size="sm"
          variant="ghost"
          onClick={onSelectAll}
          disabled={filteredCount === 0}
        >
          <CheckSquare size={15} /> Select all
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
        >
          <XSquare size={15} /> Clear
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={onExportSelected}
          disabled={selectedCount === 0}
        >
          <FileDown size={15} /> Export selected
        </Button>
      </div>
    </div>
  )
}
