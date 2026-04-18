import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getHistorialCliente } from '../api'
import toast from 'react-hot-toast'
import { usePrivacy } from '../context/PrivacyContext'

function ResumenCard({ label, value, color = 'text-gray-800 dark:text-gray-100' }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { privado } = usePrivacy()
  const oculto = '••••'

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: res } = await getHistorialCliente(id)
        setData(res)
      } catch {
        toast.error('Error al cargar historial')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  if (loading) return <p className="text-center py-10 text-gray-400">Cargando...</p>
  if (!data) return null

  const { cliente, resumen, historial } = data

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/clientes')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm">
          Clientes
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{cliente.nombre}</h1>
        <span className="text-sm text-gray-400">comision ${Number(cliente.comision_por_item).toFixed(2)}/item</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <ResumenCard label="Pedidos" value={resumen.total_pedidos} />
        <ResumenCard label="Total gastado" value={privado ? oculto : `$${resumen.total_gastado.toFixed(2)}`} />
        <ResumenCard label="Total pagado" value={privado ? oculto : `$${resumen.total_pagado.toFixed(2)}`} color="text-green-500" />
        <ResumenCard
          label="Saldo pendiente"
          value={privado ? oculto : `$${resumen.total_pendiente.toFixed(2)}`}
          color={resumen.total_pendiente > 0 ? 'text-red-500' : 'text-green-500'}
        />
      </div>

      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Historial de pedidos
      </h2>

      {historial.length === 0 ? (
        <p className="text-center py-10 text-gray-400">Sin pedidos aun.</p>
      ) : (
        <div className="space-y-3">
          {historial.map((h) => (
            <div
              key={h.pedido_cliente_id}
              onClick={() => navigate(`/pedidos/${h.pedido_id}`)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 cursor-pointer hover:shadow-md dark:hover:shadow-gray-800 transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Pedido #{h.pedido_numero ?? h.pedido_id}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(h.fecha + 'T00:00:00').toLocaleDateString('es', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      h.estado_pago === 'PAGADO'
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        : 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                    }`}>
                      {h.estado_pago}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {h.items_llegados} de {h.total_items} articulos llegados
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{privado ? oculto : `$${h.total.toFixed(2)}`}</p>
                  {h.saldo > 0 && <p className="text-sm text-red-500">{privado ? oculto : `debe $${h.saldo.toFixed(2)}`}</p>}
                  {h.saldo <= 0 && h.pagado > 0 && <p className="text-sm text-green-500">{privado ? oculto : `pagado $${h.pagado.toFixed(2)}`}</p>}
                </div>
              </div>
              {h.total > 0 && (
                <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all"
                    style={{ width: `${Math.min((h.pagado / h.total) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
