import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SidePanel from '../components/SidePanel'
import { getClientes, createCliente, updateCliente, deleteCliente, addAlias, deleteAlias } from '../api'

const AVATAR_LIGHT = ['#D4B896', '#A8B89F', '#C4A98E', '#9DA8B5', '#B89C9C']
const AVATAR_DARK  = ['#8B6E48', '#6B7C5E', '#8B6F52', '#5E6E80', '#80605F']
const avatarBg = (idx) => {
  const dark = document.documentElement.classList.contains('dark')
  return (dark ? AVATAR_DARK : AVATAR_LIGHT)[idx % 5]
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const COL = '40px 1fr 100px 80px 72px'
const formVacio = { nombre: '', comision_por_item: '0.50' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formVacio)
  const [nuevoAlias, setNuevoAlias] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [filtroSaldo, setFiltroSaldo] = useState('todos')
  const [orden, setOrden] = useState('az')
  const navigate = useNavigate()

  const cargar = async () => {
    try {
      const { data } = await getClientes()
      setClientes(data)
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo  = () => { setEditando(null); setForm(formVacio); setPanelAbierto(true) }
  const abrirEditar = (c) => { setEditando(c); setForm({ nombre: c.nombre, comision_por_item: String(c.comision_por_item) }); setPanelAbierto(true) }
  const cerrarPanel = () => { setPanelAbierto(false); setEditando(null); setForm(formVacio) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await updateCliente(editando.id, { nombre: form.nombre, comision_por_item: parseFloat(form.comision_por_item) })
        toast.success('Cliente actualizado')
      } else {
        await createCliente({ nombre: form.nombre, comision_por_item: parseFloat(form.comision_por_item) })
        toast.success('Cliente creado')
      }
      cerrarPanel(); cargar()
    } catch { toast.error('Error al guardar cliente') }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar cliente? Solo es posible si no tiene pedidos asociados.')) return
    try { await deleteCliente(id); toast.success('Cliente eliminado'); cargar() }
    catch (err) { toast.error(err.response?.data?.detail || 'Error al eliminar') }
  }

  const handleAgregarAlias = async (clienteId) => {
    const alias = nuevoAlias[clienteId]?.trim()
    if (!alias) return
    try { await addAlias(clienteId, alias); setNuevoAlias({ ...nuevoAlias, [clienteId]: '' }); cargar() }
    catch { toast.error('Ese alias ya existe') }
  }

  const handleEliminarAlias = async (clienteId, aliasId) => {
    try { await deleteAlias(clienteId, aliasId); cargar() }
    catch { toast.error('Error al eliminar alias') }
  }

  if (loading) return <p className="text-center py-16 text-ldg-muted text-sm">Cargando...</p>

  const q = busqueda.trim().toLowerCase()
  const filtrados = clientes
    .filter((c) => {
      if (q) {
        const matchNombre = c.nombre.toLowerCase().includes(q)
        const matchAlias  = c.aliases.some((a) => a.alias.toLowerCase().includes(q))
        if (!matchNombre && !matchAlias) return false
      }
      return true
    })
    .sort((a, b) => {
      if (orden === 'az') return a.nombre.localeCompare(b.nombre)
      if (orden === 'za') return b.nombre.localeCompare(a.nombre)
      if (orden === 'comision_asc')  return Number(a.comision_por_item) - Number(b.comision_por_item)
      if (orden === 'comision_desc') return Number(b.comision_por_item) - Number(a.comision_por_item)
      return 0
    })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h1 className="text-lg font-bold text-ldg-ink tracking-tight">Clientes</h1>
          <p className="text-xs text-ldg-muted mt-0.5">{clientes.length} clientes · ordenados {orden === 'az' ? 'A→Z' : orden === 'za' ? 'Z→A' : 'por comisión'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-ldg-surface border border-ldg-line rounded px-2.5 py-1.5 w-64">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ldg-muted flex-shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="nombre o alias…"
              className="flex-1 bg-transparent text-sm text-ldg-ink placeholder:text-ldg-muted-soft focus:outline-none"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-ldg-muted hover:text-ldg-ink text-base leading-none">&times;</button>
            )}
          </div>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="ldg-select text-xs"
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="comision_asc">Menor comisión</option>
            <option value="comision_desc">Mayor comisión</option>
          </select>
          <button onClick={abrirNuevo} className="ldg-btn-primary">+ Nuevo cliente</button>
        </div>
      </div>

      {clientes.length === 0 ? (
        <p className="text-center py-20 text-ldg-muted text-sm">No hay clientes aún.</p>
      ) : (
        <div className="bg-ldg-surface border border-ldg-line rounded overflow-hidden">
          {/* Table header */}
          <div
            className="grid gap-3 px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-ldg-muted bg-ldg-surface-alt border-b border-ldg-line items-center"
            style={{ gridTemplateColumns: COL }}
          >
            <span></span>
            <span>Nombre</span>
            <span className="text-right">Comisión/item</span>
            <span className="text-center">Pedidos</span>
            <span></span>
          </div>

          {filtrados.length === 0 && (
            <p className="text-center py-8 text-ldg-muted text-sm">Sin resultados para "{busqueda}".</p>
          )}

          {filtrados.map((c, i) => (
            <div key={c.id} className={i < filtrados.length - 1 ? 'border-b border-ldg-line-soft' : ''}>
              {/* Main row */}
              <div
                className="grid gap-3 px-4 py-3 items-center"
                style={{ gridTemplateColumns: COL }}
              >
                <span
                  className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-ldg-ink flex-shrink-0 av-${i % 5}`}
                >
                  {initials(c.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ldg-ink">{c.nombre}</p>
                  {c.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.aliases.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 bg-ldg-surface-alt border border-ldg-line text-[10px] text-ldg-muted px-1.5 py-0.5 rounded">
                          {a.alias}
                          <button onClick={() => handleEliminarAlias(c.id, a.id)} className="text-ldg-muted hover:text-ldg-danger transition-colors">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-right font-mono text-sm text-ldg-ink-soft">${Number(c.comision_por_item).toFixed(2)}</span>
                <span className="text-center font-mono text-xs text-ldg-muted">{c.total_pedidos ?? '—'}</span>
                <div className="flex items-center justify-end gap-3 text-[11px] text-ldg-muted">
                  <button onClick={() => navigate(`/clientes/${c.id}`)} className="hover:text-ldg-accent transition-colors">historial</button>
                  <button onClick={() => abrirEditar(c)} className="hover:text-ldg-ink transition-colors">editar</button>
                  <button onClick={() => handleEliminar(c.id)} className="hover:text-ldg-danger transition-colors">×</button>
                </div>
              </div>
              {/* Alias input row */}
              <div className="px-4 pb-2.5 flex items-center gap-2">
                <span className="text-[10px] text-ldg-muted-soft">+ alias:</span>
                <input
                  type="text"
                  placeholder="Agregar alias..."
                  value={nuevoAlias[c.id] || ''}
                  onChange={(e) => setNuevoAlias({ ...nuevoAlias, [c.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarAlias(c.id))}
                  className="border border-ldg-line bg-ldg-bg text-ldg-ink rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ldg-accent placeholder:text-ldg-muted-soft w-40"
                />
                <button
                  onClick={() => handleAgregarAlias(c.id)}
                  className="text-[11px] text-ldg-accent font-semibold hover:underline"
                >
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SidePanel open={panelAbierto} onClose={cerrarPanel} title={editando ? `Editar — ${editando.nombre}` : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Nombre <span className="text-ldg-danger">*</span></label>
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              className="ldg-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Comisión por item ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.comision_por_item}
              onChange={(e) => setForm({ ...form, comision_por_item: e.target.value })}
              className="ldg-input font-mono"
            />
            <p className="text-xs text-ldg-muted mt-1">Usa 0 si no cobras comisión.</p>
          </div>
          <button type="submit" className="ldg-btn-primary w-full py-2">
            {editando ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </form>
      </SidePanel>
    </div>
  )
}
