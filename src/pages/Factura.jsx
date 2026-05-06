import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import { getPedido } from '../api'

export default function Factura() {
  const { pcId } = useParams()
  const navigate = useNavigate()
  const facturaRef = useRef(null)
  const [pc, setPc] = useState(null)
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const pedidoId = sessionStorage.getItem('pedido_id_para_factura')
        if (!pedidoId) { navigate('/'); return }
        const { data } = await getPedido(pedidoId)
        const pedidoCliente = data.clientes.find((c) => String(c.id) === String(pcId))
        if (!pedidoCliente) { navigate('/'); return }
        setPedido(data)
        setPc(pedidoCliente)
      } catch {
        toast.error('Error al cargar factura')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [pcId])

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

  if (loading) return <p className="text-center py-16 text-ldg-muted text-sm">Cargando...</p>
  if (!pc || !pedido) return null

  const fechaFormateada = new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const itemsLlegados = pc.items.filter((i) => i.llegado)
  const pagado = Number(pc.saldo) <= 0

  return (
    <div className="min-h-screen bg-[#E8E2D4] dark:bg-[#0F0D0B] py-10 px-6 font-sans">
      {/* Toolbar — no-print */}
      <div className="no-print flex gap-2 justify-center mb-8">
        <button onClick={() => navigate(-1)} className="ldg-btn-secondary">Volver</button>
        <button onClick={handleImprimir} className="ldg-btn-secondary">Imprimir / PDF</button>
        <button onClick={handleCopiarImagen} className="ldg-btn-primary">Copiar imagen</button>
      </div>

      {/* Invoice paper */}
      <div
        ref={facturaRef}
        className="max-w-[700px] mx-auto bg-ldg-surface border border-ldg-line text-ldg-ink px-14 py-12"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-9 pb-5 border-b-2 border-ldg-ink">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-sm font-extrabold font-mono">F</div>
              <span className="text-sm font-bold tracking-widest text-ldg-ink">FACTURADOR</span>
            </div>
            <div className="text-[11px] text-ldg-muted leading-relaxed">
              Mickaell Pesántez<br />
              mickaell@gmail.com<br />
              Cuenca, Ecuador
            </div>
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
        <div className="grid grid-cols-2 gap-6 mb-7">
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
              {['#', 'Descripción', 'Llegó', 'Precio'].map((h, i) => (
                <th
                  key={h}
                  className="text-left py-2 border-b border-ldg-ink text-[10px] font-semibold tracking-widest uppercase text-ldg-muted"
                  style={{ textAlign: i === 2 ? 'center' : i === 3 ? 'right' : 'left' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pc.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 border-b border-ldg-line-soft font-mono text-ldg-muted text-xs">
                  {String(item.numero).padStart(2, '0')}
                </td>
                <td className="py-2.5 border-b border-ldg-line-soft text-ldg-ink">{item.articulo || `Artículo #${item.numero}`}</td>
                <td className="py-2.5 border-b border-ldg-line-soft text-center text-ldg-muted font-mono text-xs">
                  {item.llegado ? '✓' : '—'}
                </td>
                <td className="py-2.5 border-b border-ldg-line-soft text-right font-mono font-semibold text-ldg-ink">
                  ${Number(item.precio).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-7">
          <div className="w-72 text-sm font-mono space-y-1">
            <div className="flex justify-between text-ldg-ink-soft py-1">
              <span>Subtotal ({itemsLlegados.length} llegados)</span>
              <span>${Number(pc.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ldg-ink-soft py-1">
              <span>Comisión ({itemsLlegados.length} × ${Number(pc.cliente_comision).toFixed(2)})</span>
              <span>${Number(pc.comision).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base py-2 border-t border-b border-ldg-ink text-ldg-ink">
              <span>TOTAL</span><span>${Number(pc.total).toFixed(2)}</span>
            </div>
            {pc.pagos.length > 0 && (
              <>
                {pc.pagos.map((pago) => (
                  <div key={pago.id} className="flex justify-between text-ldg-success py-0.5">
                    <span>{pago.tipo}{pago.notas ? ` — ${pago.notas}` : ''} ({new Date(pago.fecha).toLocaleDateString('es', { day: '2-digit', month: 'short' })})</span>
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
