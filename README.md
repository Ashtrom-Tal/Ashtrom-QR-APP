# Ash QR — QR Code Generator

A lightweight, production-ready web app that turns **public links** into QR codes
for construction / BIM / project-documentation workflows. Paste a public share
link (cloud folder, file, YouTube video, or any web page), generate a sharp,
scannable QR code, organise your codes, and print or export them as designed
PDF label sheets.

> The app **does not** connect to OneDrive, Google Drive, Dropbox, SharePoint or
> any cloud provider. You upload/share your files yourself, create a public link,
> and Ash QR converts that link into a QR code. Everything is stored locally in
> your browser — no backend, no sign-in, no tracking.

---

## ✨ Features

- **Create QR codes** from a simple form (name, URL, type, project, area, description).
- **URL validation** with friendly messages and a public-link reminder.
- **Live preview** with copy-URL / open-URL actions and automatic **YouTube embed**.
- **Saved library** in `localStorage` shown as a responsive card grid.
- **Search & filter** by name, project, area, type, description or URL.
- **Per-code actions:** download **PNG**/**SVG**, print/export, copy, open, edit, delete (with confirm).
- **PDF / label designer:**
  - Page size (A4 / Letter), orientation, margins, QR size.
  - Templates: single, 2/4/6/8-up, compact grid.
  - Choose which fields appear on each label.
  - Custom PDF title, subtitle, note and footer (export-only, never saved on the item).
  - Upload a **page logo** (PNG/JPG/SVG) with 6 position options.
  - Optional **logo inside the QR** (auto high error-correction + warning).
  - **Live preview** that mirrors the output before you print/export.
- **Selection workflow:** checkbox per card, select-all, clear, export selected.
- **Remembered export settings** (page size, template, fields, margins, …).
- **Accessible & responsive:** labelled inputs, focus states, keyboard-friendly modals, works on desktop / tablet / mobile.

---

## 🧱 Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | React 18 + TypeScript                              |
| Build tool     | Vite                                               |
| QR generation  | [`qrcode`](https://www.npmjs.com/package/qrcode)   |
| PDF export     | [`jsPDF`](https://github.com/parallax/jsPDF)       |
| Icons          | [`lucide-react`](https://lucide.dev)               |
| Styling        | CSS Modules + CSS design tokens (light theme)      |
| Persistence    | Browser `localStorage` (safe wrapper + fallback)   |

No backend. No authentication. No cloud APIs.

---

## 🚀 Getting started

Requires **Node.js 18+**.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev

# 3. Build for production (type-checks, then bundles to ./dist)
npm run build

# 4. Preview the production build locally
npm run preview
```

---

## 🗂️ Project structure

```
src/
├── main.tsx               App entry point
├── App.tsx                Top-level state & layout (form ↔ preview ↔ library ↔ export)
├── index.css              Global design tokens, reset, base styles
├── types.ts               Shared domain types (QRItem, ExportSettings, …)
├── constants.ts           QR types, templates, page sizes, defaults, helper text
├── hooks/
│   ├── useLocalStorage.ts Persisted useState
│   ├── useQRLibrary.ts    CRUD layer over saved QR items (swap-in point for a backend)
│   ├── useExportSettings.ts  Export settings + persistence of the structural subset
│   └── useToast.ts        Self-dismissing notifications
├── utils/
│   ├── storage.ts         Safe localStorage wrapper (in-memory fallback)
│   ├── validation.ts      URL + form validation
│   ├── youtube.ts         YouTube detection / embed URL
│   ├── qr.ts              QR rendering: canvas, PNG data URL, SVG, centre logo
│   ├── pdf.ts             jsPDF layout engine (the label/sheet designer)
│   ├── download.ts        File download + clipboard helpers
│   ├── format.ts          Dates, URL shortening, filename sanitising
│   └── id.ts              Id generation
└── components/
    ├── ui/                Button, Field, Input, Select, TextArea, Checkbox
    ├── Header, EmptyState, Modal, ConfirmDialog, Toast
    ├── QRForm, QRPreview, QRCodeRenderer, YouTubeEmbed
    ├── QRCard, QRLibrary, SearchAndFilters
    └── ExportModal, PDFPreview, PrintableLabel
```

### How it fits together

- **`useQRLibrary`** is the single source of truth for saved items and the only
  place that talks to persistence — a real backend can replace it without
  touching the UI.
- **`utils/qr.ts`** renders every QR (preview, downloads, PDF) with one library,
  so what you see matches what you print.
- **`utils/pdf.ts`** lays out labels programmatically in millimetres, keeping QR
  codes sharp and never splitting a label across a page break.
- **`ExportModal` + `PDFPreview`** share `ExportSettings` so the on-screen preview
  mirrors the exported PDF.

---

## 🔮 Future-ready

The structure is intentionally organised so these can be added later **without a
rewrite**: a backend database, user login, dynamic QR codes, scan analytics,
cloud-provider integration, permission management, company branding presets,
saved print templates, and label sticker dimensions. None of these are
implemented now.

---

## 🔒 Privacy

All data (your QR items and export settings) lives in your browser's
`localStorage`. Uploaded logos are read locally and never sent anywhere. Clearing
your browser data will remove your saved QR codes.
