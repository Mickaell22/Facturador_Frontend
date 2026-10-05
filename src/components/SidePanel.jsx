import { useEffect, useId, useRef } from 'react'

export default function SidePanel({ open, onClose, title, children, width = 'sm:w-96' }) {
  const panelRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Al abrir: foco al primer campo (o al panel). Al cerrar: devuelve el foco
  // al boton que lo abrio, para no perder el lugar al usar el teclado.
  useEffect(() => {
    if (!open) return
    const previo = document.activeElement
    const t = setTimeout(() => {
      const campo = panelRef.current?.querySelector('[data-autofocus], input:not([type=hidden]):not([type=file]), select, textarea')
      ;(campo || panelRef.current)?.focus()
    }, 50)
    return () => { clearTimeout(t); previo?.focus?.() }
  }, [open])

  return (
    <>
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          open ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        inert={open ? undefined : ''}
        className={`fixed top-0 right-0 h-full w-full ${width} bg-ldg-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 outline-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ldg-line">
          <h2 id={titleId} className="font-semibold text-ldg-ink text-sm tracking-wide">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar panel" className="ldg-icon-btn text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          {children}
        </div>
      </div>
    </>
  )
}
