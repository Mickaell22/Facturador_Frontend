import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPedidos, deletePedido, getDashboardStats, updatePedido } from '../api'
import toast from 'react-hot-toast'
import { usePrivacy } from '../context/PrivacyContext'
import SidePanel from '../components/SidePanel'
import { initials, avatarClass } from '../utils/avatar'

function StatCell({ label, value, sub, accent, dark: darkBg }) {
  return (
    <div className={`flex-1 min-w-0 px-5 py-3.5 border-r border-ldg-line last:border-r-0 ${darkBg ? 'bg-ldg-ink' : ''}`}>
      <p className={`text-[10px] font-semibold tracking-widest uppercase mb-1.5 ${darkBg ? 'text-ldg-on-ink-soft' : 'text-ldg-muted'}`}>{label}</p>
      <p className={`text-[22px] font-bold font-mono leading-none ${accent || (darkBg ? 'text-ldg-on-ink' : 'text-ldg-ink')}`}>{value}</p>
      {sub && <p className={`text-[11px] mt-1 ${darkBg ? 'text-ldg-on-ink-soft' : 'text-ldg-muted'}`}>{sub}</p>}
    </div>
  )
}

function Pill({ kind, children }) {
  const cls = {
    pending: 'text-ldg-accent bg-ldg-accent-soft',
    ok:      'text-ldg-success bg-ldg-success-soft',
    neutral: 'text-ldg-muted bg-ldg-surface-alt',
  }[kind] || 'text-ldg-muted bg-ldg-surface-alt'
  return (
    <span className={`inline-block text-[10px] font-bold font-mono tracking-wide px-2 py-0.5 rounded-sm ${cls}`}>
      {children}
    </span>
  )
}

const COL = '56px 86px 1fr 72px 104px 104px 76px 72px'

export default function Dashboard() {
  const [pedidos, setPedidos] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [panelEditar, setPanelEditar] = useState(null)
  const [formEditar, setFormEditar] = useState({ numero: '', fecha: '', notas: '' })
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

  const abrirEditar = (p, e) => {
    e.stopPropagation()
    setFormEditar({ numero: p.numero ?? '', fecha: p.fecha, notas: p.notas ?? '' })
    setPanelEditar(p)
  }

  const handleSaveEditar = async (e) => {
    e.preventDefault()
    try {
      await updatePedido(panelEditar.id, {
        numero: formEditar.numero !== '' ? Number(formEditar.numero) : null,
        fecha: formEditar.fecha,
        notas: formEditar.notas || null,
      })
      toast.success('Pedido actualizado')
      setPanelEditar(null)
      cargar()
    } catch {
      toast.error('Error al guardar')
    }
  }

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

  if (loading) return <p className="text-center py-16 text-ldg-muted text-sm">Cargando...</p>

  const q = busqueda.trim().toLowerCase()
  let filtrados = q
    ? pedidos.filter((p) => {
        const matchNumero = String(p.numero ?? p.id).includes(q)
        const matchFecha  = p.fecha.includes(q)
        const matchCliente = p.clientes_nombres?.some((n) => n.toLowerCase().includes(q))
        return matchNumero || matchFecha || matchCliente
      })
    : pedidos

  if (filtroEstado === 'pendientes')  filtrados = filtrados.filter((p) => p.total_pendientes > 0)
  if (filtroEstado === 'completados') filtrados = filtrados.filter((p) => p.total_clientes > 0 && p.total_pendientes === 0)

  return (
    <div>
      {/* Stats strip */}
      {stats && (
        <div className="bg-ldg-surface border border-ldg-line rounded flex mb-6 overflow-hidden">
          <StatCell label="Pedidos"    value={stats.total_pedidos} sub="histórico" />
          <StatCell label="Clientes"   value={stats.total_clientes} sub={privado ? `${oculto} con saldo` : `${stats.clientes_con_deuda} con saldo`} />
          <StatCell label="Por cobrar" value={privado ? oculto : `$${stats.total_pendiente.toFixed(2)}`} sub="saldo pendiente" accent="text-ldg-accent" />
          <StatCell label="Cobrado"    value={privado ? oculto : `$${stats.total_cobrado.toFixed(2)}`}   sub="pagos recibidos" accent="text-ldg-success" />
          <StatCell label="Items"      value={stats.total_items ?? 0} sub="entregados + pendientes" />
          <StatCell label="Total general" value={privado ? oculto : `$${(stats.total_general ?? 0).toFixed(2)}`} sub="subtotal + comisiones" darkBg />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h1 className="text-lg font-bold text-ldg-ink tracking-tight">Pedidos</h1>
          <p className="text-xs text-ldg-muted mt-0.5">{pedidos.length} resultados · ordenados por fecha</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={revelar}
            className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
              privado
                ? 'border-ldg-line text-ldg-muted'
                : 'border-ldg-accent text-ldg-accent bg-ldg-accent-soft'
            }`}
          >
            {privado ? 'Mostrar' : 'Ocultar'}
          </button>
          <div className="flex items-center gap-1.5 bg-ldg-surface border border-ldg-line rounded px-2.5 py-1.5 w-72">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ldg-muted flex-shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="cliente, número o fecha…"
              className="flex-1 bg-transparent text-sm text-ldg-ink placeholder:text-ldg-muted-soft focus:outline-none"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-ldg-muted hover:text-ldg-ink text-base leading-none">&times;</button>
            )}
          </div>
          <div className="flex border border-ldg-line rounded overflow-hidden font-mono text-xs">
            {[
              { key: 'todos', label: 'todos' },
              { key: 'pendientes', label: 'pendientes' },
              { key: 'completados', label: 'completos' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltroEstado(key)}
                className={`px-3 py-1.5 border-r border-ldg-line last:border-r-0 transition-colors ${
                  filtroEstado === key
                    ? 'bg-ldg-ink text-ldg-on-ink'
                    : 'bg-ldg-surface text-ldg-ink hover:bg-ldg-surface-alt'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/pedidos/nuevo')}
            className="ldg-btn-primary"
          >
            + Nuevo pedido
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-ldg-surface border border-ldg-line rounded overflow-hidden">
        {/* Header */}
        <div
          className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted bg-ldg-surface-alt border-b border-ldg-line px-4 py-2.5 grid gap-3 items-center"
          style={{ gridTemplateColumns: COL }}
        >
          <span>#</span>
          <span>Fecha</span>
          <span>Clientes</span>
          <span className="text-right">Items</span>
          <span className="text-right">Por cobrar</span>
          <span className="text-right">Cobrado</span>
          <span className="text-center">Estado</span>
          <span></span>
        </div>

        {pedidos.length === 0 && (
          <p className="text-center py-16 text-ldg-muted text-sm">No hay pedidos aún. Crea el primero.</p>
        )}
        {pedidos.length > 0 && filtrados.length === 0 && (
          <p className="text-center py-10 text-ldg-muted text-sm">Sin resultados para "{busqueda}".</p>
        )}

        {filtrados.map((p, i) => (
          <div
            key={p.id}
            onClick={() => navigate(`/pedidos/${p.id}`)}
            className={`grid gap-3 px-4 py-3.5 text-sm items-center cursor-pointer hover:bg-ldg-surface-alt transition-colors ${
              i < filtrados.length - 1 ? 'border-b border-ldg-line-soft' : ''
            }`}
            style={{ gridTemplateColumns: COL }}
          >
            <span className="font-mono font-bold text-ldg-ink">#{String(p.numero ?? p.id).padStart(3, '0')}</span>
            <span className="font-mono text-ldg-ink-soft text-xs">{p.fecha}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {(p.clientes_nombres || []).slice(0, 3).map((n, idx) => (
                  <span
                    key={idx}
                    className={`w-5 h-5 rounded-full flex-shrink-0 inline-flex items-center justify-center text-[9px] font-bold text-ldg-ink ${avatarClass(n)}`}
                  >
                    {initials(n)}
                  </span>
                ))}
                <span className="text-xs text-ldg-ink truncate">
                  {(p.clientes_nombres || []).slice(0, 2).join(', ')}
                  {(p.clientes_nombres || []).length > 2 ? ` +${p.clientes_nombres.length - 2}` : ''}
                </span>
              </div>
              {p.notas && <p className="text-[11px] text-ldg-muted italic">{p.notas}</p>}
            </div>
            <span className="text-right font-mono text-ldg-ink-soft text-xs">{p.total_items ?? 0}</span>
            <span className={`text-right font-mono font-semibold text-xs ${p.total_por_cobrar > 0 ? 'text-ldg-accent' : 'text-ldg-muted-soft'}`}>
              {privado ? oculto : `$${Number(p.total_por_cobrar).toFixed(2)}`}
            </span>
            <span className="text-right font-mono text-ldg-success text-xs">
              {privado ? oculto : `$${Number(p.total_cobrado).toFixed(2)}`}
            </span>
            <span className="text-center">
              {p.total_pendientes > 0
                ? <Pill kind="pending">{p.total_pendientes} PEND</Pill>
                : p.total_clientes > 0
                  ? <Pill kind="ok">OK</Pill>
                  : <Pill kind="neutral">—</Pill>}
            </span>
            <div className="flex items-center justify-end gap-2 text-[11px] text-ldg-muted">
              <button
                onClick={(e) => abrirEditar(p, e)}
                className="hover:text-ldg-ink transition-colors"
              >
                editar
              </button>
              <button
                onClick={(e) => handleDelete(p.id, e)}
                className="hover:text-ldg-danger transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Panel editar pedido */}
      <SidePanel open={!!panelEditar} onClose={() => setPanelEditar(null)} title="Editar pedido">
        <form onSubmit={handleSaveEditar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Número</label>
            <input
              type="number"
              value={formEditar.numero}
              onChange={(e) => setFormEditar({ ...formEditar, numero: e.target.value })}
              className="ldg-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Fecha</label>
            <input
              type="date"
              required
              value={formEditar.fecha}
              onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })}
              className="ldg-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Notas</label>
            <input
              type="text"
              placeholder="Opcional"
              value={formEditar.notas}
              onChange={(e) => setFormEditar({ ...formEditar, notas: e.target.value })}
              className="ldg-input"
            />
          </div>
          <button type="submit" className="ldg-btn-primary w-full py-2">Guardar</button>
        </form>
      </SidePanel>
    </div>
  )
}
