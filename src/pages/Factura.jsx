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
      const canvas = await html2canvas(facturaRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast.success('Imagen copiada al portapapeles')
      })
    } catch {
      toast.error('No se pudo copiar la imagen')
    }
  }

  if (loading) return <p className="text-center py-10 text-gray-400">Cargando...</p>
  if (!pc || !pedido) return null

  const fechaFormateada = new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const itemsLlegados = pc.items.filter((i) => i.llegado)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-6 px-4">
      {/* Botones */}
      <div className="no-print flex gap-3 justify-center mb-6">
        <button onClick={() => navigate(-1)} className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
          Volver
        </button>
        <button onClick={handleImprimir} className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 dark:hover:bg-gray-600">
          Imprimir / PDF
        </button>
        <button onClick={handleCopiarImagen} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          Copiar imagen
        </button>
      </div>

      {/* Factura — fondo blanco fijo para que la imagen exportada sea legible */}
      <div ref={facturaRef} className="bg-white max-w-lg mx-auto rounded-xl shadow-sm p-6 space-y-5">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-xl font-bold text-gray-800">Resumen de pedido</h1>
          <p className="text-gray-500 text-sm mt-1">Pedido #{pedido.numero ?? pedido.id} — {fechaFormateada}</p>
          <p className="text-lg font-semibold text-gray-800 mt-2">{pc.cliente_nombre}</p>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Articulos</p>
          {pc.items.length === 0 ? (
            <p className="text-sm text-gray-400">Sin articulos registrados.</p>
          ) : (
            <div className="space-y-2">
              {pc.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.imagen_url && (
                    <img src={item.imagen_url} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!item.llegado ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.articulo || `Articulo #${item.numero}`}
                    </p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">ver enlace</a>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${!item.llegado ? 'text-gray-300' : 'text-gray-800'}`}>${Number(item.precio).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="border-t border-gray-200 pt-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal ({itemsLlegados.length} articulos llegados)</span>
            <span>${Number(pc.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Comision ({itemsLlegados.length} x ${Number(pc.cliente_comision).toFixed(2)})</span>
            <span>${Number(pc.comision).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-700 pt-1 border-t border-gray-100">
            <span>Total</span>
            <span>${Number(pc.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Pagos */}
        {pc.pagos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pagos registrados</p>
            <div className="space-y-1.5">
              {pc.pagos.map((pago) => (
                <div key={pago.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">
                    {pago.tipo}{pago.notas && ` — ${pago.notas}`}
                    <span className="text-gray-400 ml-2 text-xs">
                      {new Date(pago.fecha).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    </span>
                  </span>
                  <span className="text-green-600 font-medium">-${Number(pago.monto).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saldo */}
        <div className={`rounded-xl p-4 ${Number(pc.saldo) <= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Saldo pendiente</span>
            <span className={`text-xl font-bold ${Number(pc.saldo) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Number(pc.saldo).toFixed(2)}
            </span>
          </div>
          {Number(pc.saldo) <= 0 && <p className="text-green-600 text-xs mt-1">Pagado en su totalidad</p>}
        </div>
      </div>
    </div>
  )
}
