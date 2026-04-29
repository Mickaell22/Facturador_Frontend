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
  if (noValido) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Este enlace no es valido o ya no existe.</p>
    </div>
  )
  if (!data) return null

  const fechaFormateada = new Date(data.fecha + 'T00:00:00').toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const itemsLlegados = data.items.filter((i) => i.llegado)

  return (
    <>
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="no-print flex gap-3 justify-center mb-6">
        <button onClick={handleImprimir} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
          Imprimir / PDF
        </button>
        <button onClick={handleCopiarImagen} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          Copiar imagen
        </button>
      </div>

      <div ref={facturaRef} className="bg-white max-w-lg mx-auto rounded-xl shadow-sm p-6 space-y-5">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-xl font-bold text-gray-800">Resumen de pedido</h1>
          <p className="text-gray-500 text-sm mt-1">Pedido #{data.pedido_numero ?? data.pedido_id} — {fechaFormateada}</p>
          <p className="text-lg font-semibold text-gray-800 mt-2">{data.cliente_nombre}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Articulos</p>
          {data.items.length === 0 ? (
            <p className="text-sm text-gray-400">Sin articulos registrados.</p>
          ) : (
            <div className="space-y-2">
              {data.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.imagen_url && (
                    <img
                      src={item.imagen_url}
                      alt=""
                      className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0 cursor-zoom-in"
                      onClick={() => setLightboxSrc(item.imagen_url)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!item.llegado ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.articulo || `Articulo #${item.numero}`}
                    </p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                        ver enlace
                      </a>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${!item.llegado ? 'text-gray-300' : 'text-gray-800'}`}>${item.precio.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal ({itemsLlegados.length} articulos llegados)</span>
            <span>${data.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Comision ({itemsLlegados.length} x ${data.cliente_comision.toFixed(2)})</span>
            <span>${data.comision.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-700 pt-1 border-t border-gray-100">
            <span>Total</span>
            <span>${data.total.toFixed(2)}</span>
          </div>
        </div>

        {data.pagos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pagos registrados</p>
            <div className="space-y-1.5">
              {data.pagos.map((pago) => (
                <div key={pago.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">
                    {pago.tipo}{pago.notas && ` — ${pago.notas}`}
                    <span className="text-gray-400 ml-2 text-xs">
                      {new Date(pago.fecha).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    </span>
                  </span>
                  <span className="text-green-600 font-medium">-${pago.monto.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-xl p-4 ${data.saldo <= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Saldo pendiente</span>
            <span className={`text-xl font-bold ${data.saldo <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${data.saldo.toFixed(2)}
            </span>
          </div>
          {data.saldo <= 0 && <p className="text-green-600 text-xs mt-1">Pagado en su totalidad</p>}
        </div>
      </div>
    </div>

    {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  )
}
