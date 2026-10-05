import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getFacturaPublica } from '../api'
import Lightbox from '../components/Lightbox'
import { copiarImagen } from '../utils/copiarImagen'
import { fechaLarga, fechaCorta } from '../utils/fecha'

export default function FacturaPublica() {
  const { token } = useParams()
  const facturaRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noValido, setNoValido] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [iniciandoServidor, setIniciandoServidor] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: res } = await getFacturaPublica(token)
        setData(res)
      } catch (err) {
        if (err.response?.status === 404) setNoValido(true)
        else toast.error('Error al cargar factura')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [token])

  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setIniciandoServidor(true), 3000)
    return () => clearTimeout(t)
  }, [loading])

  useEffect(() => {
    if (!loading) return
    const key = `cold_reload_${token}`
    const t = setTimeout(() => {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
      }
    }, 7000)
    return () => clearTimeout(t)
  }, [loading, token])

  const handleImprimir = () => window.print()

  const handleCopiarImagen = () =>
    copiarImagen(facturaRef.current, `Factura_${data.pedido_numero ?? data.pedido_id}`)

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ldg-bg gap-4 px-6">
      <p className="text-ldg-muted text-sm" role="status">Cargando tu factura…</p>
      {iniciandoServidor && (
        <>
          <p className="text-ldg-muted text-sm text-center max-w-xs">
            El servidor está iniciando, esto puede tardar unos segundos.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="ldg-btn-secondary text-sm"
          >
            Si no carga, toca aquí para actualizar
          </button>
        </>
      )}
    </div>
  )

  if (noValido) return (
    <div className="min-h-screen flex items-center justify-center bg-ldg-bg px-6 text-center">
      <p className="text-ldg-muted text-sm">Este enlace no es válido o ya no existe. Pide a quien te lo envió un enlace nuevo.</p>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-ldg-bg px-6 text-center">
      <p className="text-ldg-muted text-sm">No se pudo cargar la factura. Revisa tu conexión.</p>
      <button onClick={() => window.location.reload()} className="ldg-btn-secondary">Reintentar</button>
    </div>
  )

  const fechaFormateada = fechaLarga(data.fecha)
  const itemsFacturados = data.items.filter((i) => i.activo)
  const pagado = data.saldo <= 0
  const pct    = data.total > 0 ? Math.min(100, (data.total_pagado ?? (data.total - data.saldo)) / data.total * 100) : 100
  const gridCols = '24px 44px minmax(0,1fr) auto'

  return (
    <>
      <div className="min-h-screen bg-ldg-bg font-sans" style={{ colorScheme: 'light' }}>
        {/* Minimal header */}
        <header className="border-b border-ldg-line px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[22px] h-[22px] rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-xs font-extrabold font-mono">F</div>
            <span className="text-sm font-bold tracking-widest text-ldg-ink">FACTURADOR</span>
          </div>
          <span className="text-[11px] text-ldg-muted font-mono">vista pública · solo lectura</span>
        </header>

        <div className="max-w-[720px] mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-12">
         {/* Todo lo de aqui adentro sale en "Copiar imagen" (cabecera + items + pagos) */}
         <div ref={facturaRef} className="bg-ldg-bg p-3 sm:p-4 -m-3 sm:-m-4">
          {/* Invoice heading */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Factura</div>
              <h1 className="text-[28px] sm:text-[32px] font-bold font-mono text-ldg-ink tracking-tight">#{String(data.pedido_numero ?? data.pedido_id).padStart(3, '0')}</h1>
              <p className="text-sm text-ldg-muted mt-1.5">{fechaFormateada}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Para</div>
              <div className="text-base font-bold text-ldg-ink break-words">{data.cliente_nombre}</div>
              <div className="mt-2.5">
                {pagado
                  ? <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-sm text-ldg-success bg-ldg-success-soft">PAGADO</span>
                  : <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-sm text-ldg-accent bg-ldg-accent-soft">PENDIENTE ${data.saldo.toFixed(2)}</span>}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-ldg-surface border border-ldg-line rounded overflow-hidden mb-5">
            <div
              className="grid gap-3 px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-ldg-muted bg-ldg-surface-alt border-b border-ldg-line items-center"
              style={{ gridTemplateColumns: gridCols }}
            >
              <span>#</span><span></span><span>Artículo</span>
              <span className="text-right">Precio</span>
            </div>

            {itemsFacturados.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 px-3 sm:px-4 py-3 items-center border-b border-ldg-line-soft last:border-b-0"
                style={{ gridTemplateColumns: gridCols }}
              >
                <span className="font-mono text-ldg-muted text-xs">{String(item.numero).padStart(2, '0')}</span>
                {item.imagen_url ? (
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(item.imagen_url)}
                    aria-label={`Ampliar foto de ${item.articulo || `artículo ${item.numero}`}`}
                    className="w-11 h-11 rounded overflow-hidden cursor-zoom-in"
                  >
                    <img
                      src={item.imagen_url}
                      alt=""
                      width="44"
                      height="44"
                      loading="lazy"
                      crossOrigin="anonymous"
                      className="w-11 h-11 object-cover"
                      style={{ background: 'var(--ldg-sunken)' }}
                    />
                  </button>
                ) : (
                  <div className="w-11 h-11 rounded bg-ldg-sunken flex items-center justify-center text-ldg-muted-soft text-sm" aria-hidden="true">—</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-ldg-ink break-words">
                    {item.articulo || `Artículo #${item.numero}`}
                  </p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] text-ldg-accent hover:underline">
                      <span aria-hidden="true">↗ </span>ver enlace
                    </a>
                  )}
                </div>
                <span className="text-right font-mono font-semibold text-sm text-ldg-ink">
                  ${item.precio.toFixed(2)}
                </span>
              </div>
            ))}

            {/* Totals footer */}
            <div className="px-4 py-3.5 bg-ldg-surface-alt border-t border-ldg-line">
              <div className="space-y-1 text-sm font-mono mb-3">
                <div className="flex justify-between text-ldg-ink-soft">
                  <span>subtotal ({itemsFacturados.length} items)</span>
                  <span>${data.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ldg-ink-soft">
                  <span>comisión ({itemsFacturados.length} × ${data.cliente_comision.toFixed(2)})</span>
                  <span>${data.comision.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ldg-ink font-bold pt-1.5 mt-1 border-t border-ldg-line text-base">
                  <span>TOTAL</span><span>${data.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ldg-success">
                  <span>pagado</span><span>−${(data.total_pagado ?? (data.total - data.saldo)).toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-bold text-[15px] ${pagado ? 'text-ldg-success' : 'text-ldg-accent'}`}>
                  <span>saldo</span><span>${data.saldo.toFixed(2)}</span>
                </div>
              </div>
              <div className="h-1 bg-ldg-line rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Porcentaje pagado">
                <div className={`h-full rounded-full ${pagado ? 'bg-ldg-success' : 'bg-ldg-accent'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Pagos */}
          {data.pagos.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-2">Pagos recibidos</div>
              <div className="bg-ldg-surface border border-ldg-line rounded px-4 py-2.5 space-y-1.5">
                {data.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between gap-3 text-sm font-mono">
                    <span className="text-ldg-ink-soft min-w-0 break-words">
                      {fechaCorta(p.fecha)} · {p.tipo}{p.notas ? ` (${p.notas})` : ''}
                    </span>
                    <span className="text-ldg-success font-bold flex-shrink-0">+${p.monto.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

         </div>

          {/* Actions */}
          <div className="no-print flex flex-wrap gap-2 justify-end mt-5">
            <button onClick={handleImprimir} className="ldg-btn-secondary">Imprimir / PDF</button>
            <button onClick={handleCopiarImagen} className="ldg-btn-primary">Copiar imagen</button>
          </div>
        </div>
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  )
}
