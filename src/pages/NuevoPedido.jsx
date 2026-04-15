import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPedido } from '../api'
import toast from 'react-hot-toast'

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500'

export default function NuevoPedido() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await createPedido({
        numero: form.numero ? parseInt(form.numero) : null,
        fecha: form.fecha,
        notas: form.notas || null,
      })
      toast.success('Pedido creado')
      navigate(`/pedidos/${data.id}`)
    } catch {
      toast.error('Error al crear pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Nuevo pedido</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numero de pedido</label>
          <input
            type="number"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            placeholder="Ej: 17"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            rows={2}
            placeholder="Opcional..."
            className={inputCls + ' resize-none'}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}
