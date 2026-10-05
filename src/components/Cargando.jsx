// Esqueleto de carga: evita el salto de "Cargando..." a la pagina completa.
export default function Cargando({ filas = 6 }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Cargando…</span>
      <div className="h-16 rounded border border-ldg-line bg-ldg-surface animate-ldg-pulse" />
      <div className="rounded border border-ldg-line bg-ldg-surface overflow-hidden">
        {Array.from({ length: filas }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-ldg-line-soft last:border-b-0">
            <div className="h-3 w-10 rounded bg-ldg-sunken animate-ldg-pulse" />
            <div className="h-3 flex-1 rounded bg-ldg-sunken animate-ldg-pulse" />
            <div className="h-3 w-16 rounded bg-ldg-sunken animate-ldg-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
