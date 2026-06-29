import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ConfirmContext = createContext()

// Reemplaza window.confirm() por un modal con la estetica de la app.
// Uso: const confirm = useConfirm(); if (!await confirm({ title, message, ... })) return
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((opts) => {
    const o = typeof opts === 'string' ? { message: opts } : (opts || {})
    setState({
      title: o.title ?? 'Confirmar accion',
      message: o.message ?? '¿Seguro que quieres continuar?',
      confirmText: o.confirmText ?? 'Confirmar',
      cancelText: o.cancelText ?? 'Cancelar',
      danger: o.danger ?? true,
    })
    return new Promise((res) => { resolver.current = res })
  }, [])

  const close = useCallback((result) => {
    setState(null)
    if (resolver.current) { resolver.current(result); resolver.current = null }
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        state={state}
        onCancel={() => close(false)}
        onConfirm={() => close(true)}
      />
    </ConfirmContext.Provider>
  )
}

function ConfirmDialog({ state, onCancel, onConfirm }) {
  useEffect(() => {
    if (!state) return
    const h = (e) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [state, onCancel, onConfirm])

  if (!state) return null
  const { title, message, confirmText, cancelText, danger } = state

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-ldg-fade"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-ldg-surface border border-ldg-line rounded-xl shadow-2xl p-5 animate-ldg-pop"
      >
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{
              color: 'var(--ldg-on-ink)',
              background: danger ? 'var(--ldg-danger)' : 'var(--ldg-accent)',
            }}
            aria-hidden="true"
          >
            !
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-ldg-ink text-sm tracking-wide">{title}</h2>
            <p className="mt-1 text-sm text-ldg-muted leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="ldg-btn-ghost">{cancelText}</button>
          <button
            onClick={onConfirm}
            autoFocus
            className="ldg-btn text-ldg-on-ink border-0"
            style={{ background: danger ? 'var(--ldg-danger)' : 'var(--ldg-accent)' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
