import { X } from 'lucide-react'

interface PdfViewerProps {
  url: string
  title?: string
  onClose?: () => void
}

/** Visualização embutida de PDF (contrato/documentos) sem sair da página. */
export function PdfViewer({ url, title, onClose }: PdfViewerProps) {
  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <div>
          <p className="text-sm font-semibold text-ink-900">{title || 'Documento PDF'}</p>
          <p className="text-xs text-ink-500">Visualização rápida na própria tela</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-800 hover:bg-brand-50"
          >
            Abrir em nova aba
          </a>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50"
              aria-label="Fechar visualizador"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <iframe title={title || 'PDF'} src={url} className="h-full w-full flex-1 bg-ink-50" />
    </div>
  )
}
