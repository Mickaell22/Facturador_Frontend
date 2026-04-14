import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPedidos, deletePedido } from '../api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const cargar = async () => {
    try {
      const { data } = await getPedidos()
      setPedidos(data)
    } catch {
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este pedido?')) return
    try {
      await deletePedido(id)
      toast.success('Pedido eliminado')
      cargar()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (loading) return <p className="text-center py-10 text-gray-400">Cargando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <button
          onClick={() => navigate('/pedidos/nuevo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nuevo pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
            <p className="text-gray-400">No hay pedidos aun. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/pedidos/${p.id}`)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">
                    Pedido #{p.numero ?? p.id}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-sm text-gray-500">
                  <span>{p.total_clientes} cliente{p.total_clientes !== 1 ? 's' : ''}</span>
                  {p.total_pendientes > 0 && (
                    <span className="text-orange-500 font-medium">
                      {p.total_pendientes} pendiente{p.total_pendientes !== 1 ? 's' : ''}
                    </span>
                  )}
                  {p.total_pendientes === 0 && p.total_clientes > 0 && (
                    <span className="text-green-500 font-medium">✓ Todo pagado</span>
                  )}
                </div>
                {p.notas && <p className="text-xs text-gray-400 mt-1">{p.notas}</p>}
              </div>
              <button
                onClick={(e) => handleDelete(p.id, e)}
                className="text-gray-300 hover:text-red-400 transition-colors p-1 text-sm"
                title="Eliminar"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
