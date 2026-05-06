import { useEffect } from 'react'

export default function SidePanel({ open, onClose, title, children, width = 'w-96' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          open ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full ${width} bg-ldg-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ldg-line">
          <h2 className="font-semibold text-ldg-ink text-sm tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="text-ldg-muted hover:text-ldg-ink transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}
        </div>
      </div>
    </>
  )
}
