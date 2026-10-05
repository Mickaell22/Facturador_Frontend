import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getPedido, errorMsg } from '../api'
import { copiarImagen } from '../utils/copiarImagen'
import { fechaLarga, fechaCorta } from '../utils/fecha'

// Datos del emisor que salen en la cabecera; se configuran por entorno
const EMISOR = [
  import.meta.env.VITE_EMISOR_NOMBRE,
  import.meta.env.VITE_EMISOR_EMAIL,
  import.meta.env.VITE_EMISOR_CIUDAD,
].filter(Boolean)

export default function Factura() {
  const { pcId } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const facturaRef = useRef(null)
  const [pc, setPc] = useState(null)
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        // ?pedido= hace el enlace autosuficiente (recargable, abrible en otra pestaña);
        // sessionStorage queda como respaldo para enlaces viejos
        const pedidoId = params.get('pedido') || sessionStorage.getItem('pedido_id_para_factura')
        if (!pedidoId) return
        const { data } = await getPedido(pedidoId)
        const pedidoCliente = data.clientes.find((c) => String(c.id) === String(pcId))
        if (!pedidoCliente) return
        setPedido(data)
        setPc(pedidoCliente)
      } catch (err) {
        toast.error(errorMsg(err, 'Error al cargar factura'))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [pcId, params])

  const handleImprimir = () => window.print()

  if (loading) return <p className="text-center py-16 text-ldg-muted text-sm" role="status">Cargando…</p>
  if (!pc || !pedido) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-ldg-muted text-sm">No se encontró esta factura. Ábrela desde el pedido con el botón "Factura".</p>
      <Link to="/" className="ldg-btn-secondary">Ir a pedidos</Link>
    </div>
  )

  const handleCopiarImagen = () =>
    copiarImagen(facturaRef.current, `Factura_${pedido.numero ?? pedido.id}_${pc.cliente_nombre}`)

  const fechaFormateada = fechaLarga(pedido.fecha)
  const itemsFacturados = pc.items.filter((i) => i.activo)
  const pagado = Number(pc.saldo) <= 0

  return (
    <div className="min-h-screen bg-ldg-sunken py-6 sm:py-10 px-3 sm:px-6 font-sans">
      {/* Toolbar — no-print */}
      <div className="no-print flex flex-wrap gap-2 justify-center mb-6 sm:mb-8">
        <button onClick={() => navigate(-1)} className="ldg-btn-secondary">Volver</button>
        <button onClick={handleImprimir} className="ldg-btn-secondary">Imprimir / PDF</button>
        <button onClick={handleCopiarImagen} className="ldg-btn-primary">Copiar imagen</button>
      </div>

      {/* Invoice paper */}
      <div
        ref={facturaRef}
        className="max-w-[700px] mx-auto bg-ldg-surface border border-ldg-line text-ldg-ink px-5 py-8 sm:px-14 sm:py-12"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-9 pb-5 border-b-2 border-ldg-ink">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-sm font-extrabold font-mono">F</div>
              <span className="text-sm font-bold tracking-widest text-ldg-ink">FACTURADOR</span>
            </div>
            {EMISOR.length > 0 && (
              <div className="text-[11px] text-ldg-muted leading-relaxed">
                {EMISOR.map((l) => <div key={l}>{l}</div>)}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-ldg-muted mb-1">Factura</div>
            <div className="text-[28px] font-bold font-mono text-ldg-ink tracking-tight">
              #{String(pedido.numero ?? pedido.id).padStart(3, '0')}
            </div>
            <div className="text-xs text-ldg-ink-soft mt-1 font-mono">{fechaFormateada}</div>
          </div>
        </div>

        {/* Billing info */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-7">
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Facturado a</div>
            <div className="text-base font-bold text-ldg-ink">{pc.cliente_nombre}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Estado</div>
            <div className={`text-base font-bold font-mono ${pagado ? 'text-ldg-success' : 'text-ldg-accent'}`}>
              {pagado ? 'PAGADO' : `SALDO $${Number(pc.saldo).toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 border-b border-ldg-ink text-[10px] font-semibold tracking-widest uppercase text-ldg-muted">#</th>
              <th className="text-left py-2 border-b border-ldg-ink text-[10px] font-semibold tracking-widest uppercase text-ldg-muted w-12"></th>
              <th className="text-left py-2 border-b border-ldg-ink text-[10px] font-semibold tracking-widest uppercase text-ldg-muted">Descripción</th>
              <th className="text-right py-2 border-b border-ldg-ink text-[10px] font-semibold tracking-widest uppercase text-ldg-muted">Precio</th>
            </tr>
          </thead>
          <tbody>
            {itemsFacturados.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 border-b border-ldg-line-soft font-mono text-ldg-muted text-xs">
                  {String(item.numero).padStart(2, '0')}
                </td>
                <td className="py-2.5 border-b border-ldg-line-soft">
                  {item.imagen_url
                    ? <img src={item.imagen_url} alt="" width="40" height="40" crossOrigin="anonymous" className="w-10 h-10 object-cover rounded" style={{ background: 'var(--ldg-sunken)' }} />
                    : <div className="w-10 h-10 rounded bg-ldg-sunken" />}
                </td>
                <td className="py-2.5 border-b border-ldg-line-soft text-ldg-ink">{item.articulo || `Artículo #${item.numero}`}</td>
                <td className="py-2.5 border-b border-ldg-line-soft text-right font-mono font-semibold text-ldg-ink">
                  ${Number(item.precio).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-7">
          <div className="w-full sm:w-80 text-sm font-mono space-y-1">
            <div className="flex justify-between text-ldg-ink-soft py-1">
              <span>Subtotal ({itemsFacturados.length} items)</span>
              <span>${Number(pc.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ldg-ink-soft py-1">
              <span>Comisión ({itemsFacturados.length} × ${Number(pc.cliente_comision).toFixed(2)})</span>
              <span>${Number(pc.comision).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base py-2 border-t border-b border-ldg-ink text-ldg-ink">
              <span>TOTAL</span><span>${Number(pc.total).toFixed(2)}</span>
            </div>
            {pc.pagos.length > 0 && (
              <>
                {pc.pagos.map((pago) => (
                  <div key={pago.id} className="flex justify-between text-ldg-success py-0.5">
                    <span>{pago.tipo}{pago.notas ? ` — ${pago.notas}` : ''} ({fechaCorta(pago.fecha)})</span>
                    <span>−${Number(pago.monto).toFixed(2)}</span>
                  </div>
                ))}
                <div className={`flex justify-between font-bold py-1 ${pagado ? 'text-ldg-success' : 'text-ldg-accent'}`}>
                  <span>Saldo</span><span>${Number(pc.saldo).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-9 pt-4 border-t border-ldg-line-soft text-[11px] text-ldg-muted text-center font-mono tracking-widest">
          GRACIAS POR TU COMPRA · FACTURADOR
        </div>
      </div>
    </div>
  )
}
