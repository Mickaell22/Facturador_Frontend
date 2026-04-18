import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPedidos, deletePedido, getDashboardStats } from '../api'
import toast from 'react-hot-toast'
import { usePrivacy } from '../context/PrivacyContext'

function StatCard({ label, value, sub, color = 'text-gray-800 dark:text-gray-100' }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [pedidos, setPedidos] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const { privado, revelar } = usePrivacy()
  const oculto = '••••'
  const navigate = useNavigate()

  const cargar = async () => {
    try {
      const [pedidosRes, statsRes] = await Promise.all([getPedidos(), getDashboardStats()])
      setPedidos(pedidosRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Eliminar este pedido?')) return
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
    <div className="space-y-6">
      {stats && (
        <div>
        <div className="flex justify-end mb-2">
          <button
            onClick={revelar}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              privado
                ? 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                : 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {privado ? 'Mostrar cifras' : 'Ocultar'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total pedidos" value={stats.total_pedidos} />
          <StatCard
            label="Clientes"
            value={stats.total_clientes}
            sub={privado ? `${oculto} con saldo pendiente` : `${stats.clientes_con_deuda} con saldo pendiente`}
          />
          <StatCard
            label="Por cobrar"
            value={privado ? oculto : `$${stats.total_pendiente.toFixed(2)}`}
            color="text-red-500"
            sub="saldo pendiente total"
          />
          <StatCard
            label="Cobrado"
            value={privado ? oculto : `$${stats.total_cobrado.toFixed(2)}`}
            color="text-green-500"
            sub="pagos registrados"
          />
        </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pedidos</h2>
          <button
            onClick={() => navigate('/pedidos/nuevo')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Nuevo pedido
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, numero o fecha (ej: 2025-05)..."
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
              >
                &times;
              </button>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'pendientes', label: 'Pendientes' },
              { key: 'completados', label: 'Completados' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltroEstado(key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const q = busqueda.trim().toLowerCase()
          let filtrados = q
            ? pedidos.filter((p) => {
                const matchNumero = String(p.numero ?? p.id).includes(q)
                const matchFecha = p.fecha.includes(q)
                const matchCliente = p.clientes_nombres?.some((n) =>
                  n.toLowerCase().includes(q)
                )
                return matchNumero || matchFecha || matchCliente
              })
            : pedidos

          if (filtroEstado === 'pendientes') {
            filtrados = filtrados.filter((p) => p.total_pendientes > 0)
          } else if (filtroEstado === 'completados') {
            filtrados = filtrados.filter((p) => p.total_clientes > 0 && p.total_pendientes === 0)
          }

          if (pedidos.length === 0) {
            return <p className="text-center py-16 text-gray-400">No hay pedidos aun. Crea el primero.</p>
          }
          if (filtrados.length === 0) {
            return <p className="text-center py-10 text-gray-400">Sin resultados para "{busqueda}".</p>
          }
          return (
          <div className="space-y-3">
            {filtrados.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/pedidos/${p.id}`)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 cursor-pointer hover:shadow-md dark:hover:shadow-gray-800 transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Pedido #{p.numero ?? p.id}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {p.total_pendientes > 0 ? (
                      <span className="text-xs text-orange-500 font-medium">
                        {p.total_pendientes} pendiente{p.total_pendientes !== 1 ? 's' : ''}
                      </span>
                    ) : p.total_clientes > 0 ? (
                      <span className="text-xs text-green-500 font-medium">Todo pagado</span>
                    ) : null}
                  </div>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-sm px-2 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-gray-400">
                    {p.total_clientes} cliente{p.total_clientes !== 1 ? 's' : ''}
                  </span>
                  {p.total_clientes > 0 && (
                    <>
                      <span className="text-red-500 font-medium">
                        por cobrar ${Number(p.total_por_cobrar).toFixed(2)}
                      </span>
                      <span className="text-green-500 font-medium">
                        cobrado ${Number(p.total_cobrado).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                {p.notas && <p className="text-xs text-gray-400 mt-1">{p.notas}</p>}
              </div>
            ))}
          </div>
          )
        })()}
      </div>
    </div>
  )
}
