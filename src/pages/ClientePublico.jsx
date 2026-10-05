import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getHistorialClientePublico } from '../api'
import { copiarImagen } from '../utils/copiarImagen'
import { fechaCorta } from '../utils/fecha'

function ResumenCard({ label, value, color = 'text-ldg-ink' }) {
  return (
    <div className="bg-ldg-surface border border-ldg-line rounded p-4">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">{label}</p>
      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  )
}

export default function ClientePublico() {
  const { token } = useParams()
  const contenidoRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noValido, setNoValido] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: res } = await getHistorialClientePublico(token)
        setData(res)
      } catch (err) {
        if (err.response?.status === 404) setNoValido(true)
        else toast.error('No se pudo cargar el historial. Revisa tu conexión.')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [token])

  const Centro = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-ldg-bg px-6 text-center">{children}</div>
  )

  if (loading) return <Centro><p className="text-ldg-muted text-sm" role="status">Cargando historial…</p></Centro>
  if (noValido) return <Centro><p className="text-ldg-muted text-sm">Este enlace no es válido o ya no existe. Pide a quien te lo envió un enlace nuevo.</p></Centro>
  if (!data) return (
    <Centro>
      <p className="text-ldg-muted text-sm">No se pudo cargar el historial.</p>
      <button onClick={() => window.location.reload()} className="ldg-btn-secondary">Reintentar</button>
    </Centro>
  )

  const { cliente, resumen, historial } = data
  const debe = resumen.total_pendiente > 0

  return (
    <div className="min-h-screen bg-ldg-bg font-sans" style={{ colorScheme: 'light' }}>
      <header className="border-b border-ldg-line px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-xs font-extrabold font-mono" aria-hidden="true">F</div>
          <span className="text-sm font-bold tracking-widest text-ldg-ink">FACTURADOR</span>
        </div>
        <span className="text-[11px] text-ldg-muted font-mono">vista pública · solo lectura</span>
      </header>

      <main className="max-w-lg mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-12">
        <div ref={contenidoRef} className="bg-ldg-bg p-3 -m-3 space-y-5">
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Historial de cuenta</div>
            <h1 className="text-2xl font-bold text-ldg-ink tracking-tight break-words">{cliente.nombre}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ResumenCard label="Pedidos" value={resumen.total_pedidos} />
            <ResumenCard
              label="Saldo pendiente"
              value={`$${resumen.total_pendiente.toFixed(2)}`}
              color={debe ? 'text-ldg-accent' : 'text-ldg-success'}
            />
            <ResumenCard label="Total gastado" value={`$${resumen.total_gastado.toFixed(2)}`} />
            <ResumenCard label="Total pagado" value={`$${resumen.total_pagado.toFixed(2)}`} color="text-ldg-success" />
          </div>

          {historial.length === 0 ? (
            <p className="text-center py-4 text-ldg-muted text-sm">Sin pedidos registrados.</p>
          ) : (
            <section aria-label="Pedidos">
              <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-2">Pedidos</div>
              <ul className="bg-ldg-surface border border-ldg-line rounded divide-y divide-ldg-line-soft">
                {historial.map((h) => {
                  const pagado = h.estado_pago === 'PAGADO'
                  const pct = h.total > 0 ? Math.min((h.pagado / h.total) * 100, 100) : 100
                  return (
                    <li key={h.pedido_id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-ldg-ink text-sm">
                              #{String(h.pedido_numero ?? h.pedido_id).padStart(3, '0')}
                            </span>
                            <span className="text-xs text-ldg-muted">{fechaCorta(h.fecha)}</span>
                            <span className={`text-[10px] font-bold font-mono tracking-wide px-2 py-0.5 rounded-sm ${
                              pagado ? 'text-ldg-success bg-ldg-success-soft' : 'text-ldg-accent bg-ldg-accent-soft'
                            }`}>
                              {pagado ? 'PAGADO' : 'PENDIENTE'}
                            </span>
                          </div>
                          <p className="text-xs text-ldg-muted mt-0.5">
                            {h.items_activos} de {h.total_items} artículos activos
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 font-mono">
                          <p className="font-semibold text-ldg-ink text-sm">${h.total.toFixed(2)}</p>
                          {h.saldo > 0 && <p className="text-xs text-ldg-accent">debe ${h.saldo.toFixed(2)}</p>}
                        </div>
                      </div>
                      {h.total > 0 && (
                        <div className="mt-2 h-1 bg-ldg-line-soft rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Porcentaje pagado">
                          <div className={`h-full rounded-full ${pagado ? 'bg-ldg-success' : 'bg-ldg-accent'}`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {resumen.total_pedidos > 0 && (
            <div className={`rounded border p-4 flex justify-between items-center ${
              debe ? 'bg-ldg-accent-soft border-ldg-line' : 'bg-ldg-success-soft border-ldg-line'
            }`}>
              <span className="font-semibold text-ldg-ink">{debe ? 'Total pendiente' : 'Saldo'}</span>
              <span className={`text-xl font-bold font-mono ${debe ? 'text-ldg-accent' : 'text-ldg-success'}`}>
                {debe ? `$${resumen.total_pendiente.toFixed(2)}` : 'Al día'}
              </span>
            </div>
          )}
        </div>

        <div className="no-print flex flex-wrap gap-2 justify-end mt-5">
          <button onClick={() => window.print()} className="ldg-btn-secondary">Imprimir / PDF</button>
          <button onClick={() => copiarImagen(contenidoRef.current, `Historial_${cliente.nombre}`)} className="ldg-btn-primary">Copiar imagen</button>
        </div>
      </main>
    </div>
  )
}
