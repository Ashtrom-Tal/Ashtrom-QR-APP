import { useEffect, useId, useRef, useState } from 'react'
import { Info, Pencil, Plus, X } from 'lucide-react'
import type { QRFormValues, QRItem, QRType } from '../types'
import { PUBLIC_LINK_REMINDER, QR_TYPES } from '../constants'
import { validateForm, type FieldErrors } from '../utils/validation'
import { isYouTubeUrl } from '../utils/youtube'
import { Field } from './ui/Field'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { TextArea } from './ui/TextArea'
import { Button } from './ui/Button'
import styles from './QRForm.module.css'

const EMPTY: QRFormValues = {
  name: '',
  url: '',
  type: 'website',
  project: '',
  area: '',
  description: '',
}

function toFormValues(item: QRItem): QRFormValues {
  return {
    name: item.name,
    url: item.url,
    type: item.type,
    project: item.project ?? '',
    area: item.area ?? '',
    description: item.description ?? '',
  }
}

interface QRFormProps {
  editingItem: QRItem | null
  onSubmit: (values: QRFormValues) => void
  onChange?: (values: QRFormValues) => void
  onCancelEdit: () => void
}

export function QRForm({ editingItem, onSubmit, onChange, onCancelEdit }: QRFormProps) {
  const [values, setValues] = useState<QRFormValues>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const typeTouched = useRef(false)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const baseId = useId()
  const ids = {
    name: `${baseId}-name`,
    url: `${baseId}-url`,
    type: `${baseId}-type`,
    project: `${baseId}-project`,
    area: `${baseId}-area`,
    description: `${baseId}-description`,
  }

  // Load the item being edited (or reset when editing ends).
  useEffect(() => {
    if (editingItem) {
      setValues(toFormValues(editingItem))
      typeTouched.current = true
    } else {
      setValues(EMPTY)
      typeTouched.current = false
    }
    setErrors({})
    setSubmitted(false)
  }, [editingItem])

  // Report live values to the parent for the preview.
  useEffect(() => {
    onChangeRef.current?.(values)
  }, [values])

  const setField = <K extends keyof QRFormValues>(field: K, value: QRFormValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'type') typeTouched.current = true
      if (field === 'url' && !typeTouched.current && isYouTubeUrl(String(value))) {
        next.type = 'youtube'
      }
      if (submitted) setErrors(validateForm(next))
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const nextErrors = validateForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit(values)

    if (!editingItem) {
      setValues(EMPTY)
      setSubmitted(false)
      typeTouched.current = false
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {editingItem && (
        <span className={styles.editingTag}>
          <Pencil size={13} /> Editing “{editingItem.name}”
        </span>
      )}

      <Field label="QR name" htmlFor={ids.name} required error={errors.name}>
        <Input
          id={ids.name}
          value={values.name}
          placeholder="e.g. Level 3 — Site Photos"
          invalid={!!errors.name}
          onChange={(e) => setField('name', e.target.value)}
          autoComplete="off"
        />
      </Field>

      <Field
        label="URL"
        htmlFor={ids.url}
        required
        error={errors.url}
        hint={
          <span className={styles.reminder}>
            <Info size={15} />
            {PUBLIC_LINK_REMINDER}
          </span>
        }
      >
        <Input
          id={ids.url}
          type="url"
          inputMode="url"
          value={values.url}
          placeholder="https://…"
          invalid={!!errors.url}
          onChange={(e) => setField('url', e.target.value)}
          autoComplete="off"
        />
      </Field>

      <Field label="Type" htmlFor={ids.type} required>
        <Select
          id={ids.type}
          value={values.type}
          onChange={(e) => setField('type', e.target.value as QRType)}
        >
          {QR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className={styles.row2}>
        <Field label="Project" htmlFor={ids.project}>
          <Input
            id={ids.project}
            value={values.project}
            placeholder="Optional"
            onChange={(e) => setField('project', e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Area / Location" htmlFor={ids.area}>
          <Input
            id={ids.area}
            value={values.area}
            placeholder="Optional"
            onChange={(e) => setField('area', e.target.value)}
            autoComplete="off"
          />
        </Field>
      </div>

      <Field label="Description" htmlFor={ids.description}>
        <TextArea
          id={ids.description}
          value={values.description}
          placeholder="Optional notes about this link"
          onChange={(e) => setField('description', e.target.value)}
          rows={3}
        />
      </Field>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" block={!editingItem}>
          {editingItem ? (
            <>
              <Pencil size={16} /> Save changes
            </>
          ) : (
            <>
              <Plus size={16} /> Generate &amp; Save
            </>
          )}
        </Button>
        {editingItem && (
          <Button type="button" variant="ghost" onClick={onCancelEdit}>
            <X size={16} /> Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
