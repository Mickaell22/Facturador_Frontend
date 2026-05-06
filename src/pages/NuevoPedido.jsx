import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPedido } from '../api'
import toast from 'react-hot-toast'

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
    <div>
      <div className="text-xs text-ldg-muted mb-2">
        <button onClick={() => navigate('/')} className="hover:text-ldg-ink transition-colors">Pedidos</button>
        <span className="mx-2">/</span>
        <span>Nuevo</span>
      </div>

      <div className="flex items-end justify-between mb-5 pb-4 border-b border-ldg-line">
        <div>
          <h1 className="text-[28px] font-bold text-ldg-ink tracking-tight">Nuevo pedido</h1>
          <p className="text-sm text-ldg-muted mt-1.5">La numeración se asigna automáticamente si se deja en blanco.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/')} className="ldg-btn-secondary">Cancelar</button>
          <button
            form="form-nuevo-pedido"
            type="submit"
            disabled={loading}
            className="ldg-btn-primary disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear pedido →'}
          </button>
        </div>
      </div>

      <div className="max-w-lg">
        <form id="form-nuevo-pedido" onSubmit={handleSubmit} className="bg-ldg-surface border border-ldg-line rounded p-4 space-y-4">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-2">Datos del pedido</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-ldg-muted mb-1">Número (opcional)</label>
              <input
                type="number"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Ej: 17"
                className="ldg-input font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ldg-muted mb-1">Fecha <span className="text-ldg-danger">*</span></label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="ldg-input font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-ldg-muted mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Promo abril — envío express"
              className="ldg-input italic"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
