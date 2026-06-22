import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import { getHistorialClientePublico } from '../api'

function ResumenCard({ label, value, color = 'text-gray-800' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
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
        else toast.error('Error al cargar historial')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [token])

  const handleImprimir = () => window.print()

  const handleCopiarImagen = async () => {
    if (!contenidoRef.current) return
    try {
      const canvas = await html2canvas(contenidoRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
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

  const { cliente, resumen, historial } = data

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

      <div ref={contenidoRef} className="bg-white max-w-lg mx-auto rounded-xl shadow-sm p-6 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-xl font-bold text-gray-800">Historial de cuenta</h1>
          <p className="text-lg font-semibold text-gray-800 mt-1">{cliente.nombre}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ResumenCard label="Pedidos" value={resumen.total_pedidos} />
          <ResumenCard
            label="Saldo pendiente"
            value={`$${resumen.total_pendiente.toFixed(2)}`}
            color={resumen.total_pendiente > 0 ? 'text-red-600' : 'text-green-600'}
          />
          <ResumenCard label="Total gastado" value={`$${resumen.total_gastado.toFixed(2)}`} />
          <ResumenCard label="Total pagado" value={`$${resumen.total_pagado.toFixed(2)}`} color="text-green-600" />
        </div>

        {historial.length === 0 ? (
          <p className="text-center py-4 text-gray-400 text-sm">Sin pedidos registrados.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pedidos</p>
            {historial.map((h) => (
              <div key={h.pedido_id} className="border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">
                        Pedido #{h.pedido_numero ?? h.pedido_id}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(h.fecha + 'T00:00:00').toLocaleDateString('es', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        h.estado_pago === 'PAGADO'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {h.estado_pago}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.items_activos} de {h.total_items} articulos activos
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-gray-800 text-sm">${h.total.toFixed(2)}</p>
                    {h.saldo > 0 && <p className="text-xs text-red-500">debe ${h.saldo.toFixed(2)}</p>}
                    {h.saldo <= 0 && h.pagado > 0 && <p className="text-xs text-green-500">pagado</p>}
                  </div>
                </div>
                {h.total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${Math.min((h.pagado / h.total) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {resumen.total_pendiente > 0 && (
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total pendiente</span>
              <span className="text-xl font-bold text-red-600">${resumen.total_pendiente.toFixed(2)}</span>
            </div>
          </div>
        )}
        {resumen.total_pendiente <= 0 && resumen.total_pedidos > 0 && (
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Saldo</span>
              <span className="text-xl font-bold text-green-600">Al dia</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
