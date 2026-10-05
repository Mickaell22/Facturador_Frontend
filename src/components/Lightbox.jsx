import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Lightbox({ src, onClose }) {
  const cerrarRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    const previo = document.activeElement
    cerrarRef.current?.focus()
    return () => { document.removeEventListener('keydown', handler); previo?.focus?.() }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overscroll-contain"
      onClick={onClose}
    >
      <button
        ref={cerrarRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white text-2xl leading-none hover:bg-black/80"
      >
        &times;
      </button>
      <img
        src={src}
        alt=""
        className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  )
}
