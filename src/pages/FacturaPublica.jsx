import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import { getFacturaPublica } from '../api'
import Lightbox from '../components/Lightbox'

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

  const handleCopiarImagen = async () => {
    if (!facturaRef.current) return
    try {
      const canvas = await html2canvas(facturaRef.current, { scale: 2, useCORS: true, backgroundColor: '#FFFCF5' })
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast.success('Imagen copiada al portapapeles')
      })
    } catch {
      toast.error('No se pudo copiar la imagen')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ldg-bg gap-4 px-6">
      <p className="text-ldg-muted text-sm">Cargando...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-ldg-bg">
      <p className="text-ldg-muted text-sm">Este enlace no es válido o ya no existe.</p>
    </div>
  )

  if (!data) return null

  const fechaFormateada = new Date(data.fecha + 'T00:00:00').toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const itemsFacturados = data.items.filter((i) => i.activo)
  const pagado = data.saldo <= 0
  const pct    = data.total > 0 ? Math.min(100, (data.total_pagado ?? (data.total - data.saldo)) / data.total * 100) : 100
  const gridCols = '36px 52px 1fr 96px'

  return (
    <>
      <div className="min-h-screen bg-ldg-bg font-sans" style={{ colorScheme: 'light' }}>
        {/* Minimal header */}
        <header className="border-b border-ldg-line px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[22px] h-[22px] rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-xs font-extrabold font-mono">F</div>
            <span className="text-sm font-bold tracking-widest text-ldg-ink">FACTURADOR</span>
          </div>
          <span className="text-[11px] text-ldg-muted font-mono">vista pública · solo lectura</span>
        </header>

        <div className="max-w-[720px] mx-auto px-6 py-8 pb-12">
          {/* Invoice heading */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Factura</div>
              <h1 className="text-[32px] font-bold font-mono text-ldg-ink tracking-tight">#{String(data.pedido_numero ?? data.pedido_id).padStart(3, '0')}</h1>
              <p className="text-sm text-ldg-muted mt-1.5">{fechaFormateada}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Para</div>
              <div className="text-base font-bold text-ldg-ink">{data.cliente_nombre}</div>
              <div className="mt-2.5">
                {pagado
                  ? <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-sm text-ldg-success bg-ldg-success-soft">PAGADO</span>
                  : <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-sm text-ldg-accent bg-ldg-accent-soft">PENDIENTE ${data.saldo.toFixed(2)}</span>}
              </div>
            </div>
          </div>

          {/* Items */}
          <div ref={facturaRef} className="bg-ldg-surface border border-ldg-line rounded overflow-hidden mb-5">
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
                className="grid gap-3 px-4 py-3 items-center border-b border-ldg-line-soft last:border-b-0"
                style={{ gridTemplateColumns: gridCols }}
              >
                <span className="font-mono text-ldg-muted text-xs">{String(item.numero).padStart(2, '0')}</span>
                {item.imagen_url ? (
                  <img
                    src={item.imagen_url}
                    alt=""
                    className="w-11 h-11 object-cover rounded cursor-zoom-in"
                    style={{ background: 'var(--ldg-sunken)' }}
                    onClick={() => setLightboxSrc(item.imagen_url)}
                  />
                ) : (
                  <div className="w-11 h-11 rounded bg-ldg-sunken flex items-center justify-center text-ldg-muted-soft text-sm">—</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-ldg-ink">
                    {item.articulo || `Artículo #${item.numero}`}
                  </p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] text-ldg-accent hover:underline">
                      ↗ ver enlace
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
              <div className="h-1 bg-ldg-line rounded-full overflow-hidden">
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
                  <div key={p.id} className="flex justify-between text-sm font-mono">
                    <span className="text-ldg-ink-soft">
                      {p.fecha} · {p.tipo}{p.notas ? ` (${p.notas})` : ''}
                    </span>
                    <span className="text-ldg-success font-bold">+${p.monto.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="no-print flex gap-2 justify-end">
            <button onClick={handleImprimir} className="ldg-btn-secondary">Imprimir</button>
            <button onClick={handleCopiarImagen} className="ldg-btn-secondary">Copiar imagen</button>
          </div>

          <div className="mt-8 text-[11px] text-ldg-muted text-center font-mono tracking-wide">
            facturador · {token}
          </div>
        </div>
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  )
}
