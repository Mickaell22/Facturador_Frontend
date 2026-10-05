import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPedidos, deletePedido, getDashboardStats, updatePedido, errorMsg } from '../api'
import toast from 'react-hot-toast'
import { usePrivacy } from '../context/PrivacyContext'
import SidePanel from '../components/SidePanel'
import Cargando from '../components/Cargando'
import { initials, avatarClass } from '../utils/avatar'
import { fechaCorta } from '../utils/fecha'
import { useConfirm } from '../context/ConfirmContext'

function StatCell({ label, value, sub, accent, dark: darkBg }) {
  return (
    <div className={`flex-1 min-w-[130px] px-5 py-3.5 border-r border-ldg-line last:border-r-0 ${darkBg ? 'bg-ldg-ink' : ''}`}>
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

const COL = '56px 96px 1fr 56px 104px 104px 76px 76px'
const FILTROS = [
  { key: 'todos', label: 'todos' },
  { key: 'pendientes', label: 'pendientes' },
  { key: 'completados', label: 'completos' },
]

export default function Dashboard() {
  const [pedidos, setPedidos] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  // Busqueda y filtro viven en la URL: se conservan al volver desde un pedido
  const [params, setParams] = useSearchParams()
  const busqueda = params.get('q') ?? ''
  const filtroEstado = params.get('estado') ?? 'todos'
  const setParam = (k, v, def) => setParams((p) => {
    const n = new URLSearchParams(p)
    v && v !== def ? n.set(k, v) : n.delete(k)
    return n
  }, { replace: true })

  const [panelEditar, setPanelEditar] = useState(null)
  const [formEditar, setFormEditar] = useState({ numero: '', fecha: '', notas: '' })
  const { privado, revelar } = usePrivacy()
  const oculto = '••••'
  const confirm = useConfirm()

  const cargar = async () => {
    try {
      const [pedidosRes, statsRes] = await Promise.all([getPedidos(), getDashboardStats()])
      setPedidos(pedidosRes.data)
      setStats(statsRes.data)
    } catch (err) {
      toast.error(errorMsg(err, 'Error al cargar datos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirEditar = (p) => {
    setFormEditar({ numero: p.numero ?? '', fecha: p.fecha, notas: p.notas ?? '' })
    setPanelEditar(p)
  }

  const handleSaveEditar = async (e) => {
    e.preventDefault()
    if (guardando) return
    setGuardando(true)
    try {
      await updatePedido(panelEditar.id, {
        numero: formEditar.numero !== '' ? Number(formEditar.numero) : null,
        fecha: formEditar.fecha,
        notas: formEditar.notas.trim() || null,
      })
      toast.success('Pedido actualizado')
      setPanelEditar(null)
      cargar()
    } catch (err) {
      toast.error(errorMsg(err, 'Error al guardar'))
    } finally {
      setGuardando(false)
    }
  }

  const handleDelete = async (p) => {
    if (!await confirm({
      title: `Eliminar pedido #${String(p.numero ?? p.id).padStart(3, '0')}`,
      message: '¿Seguro que quieres eliminar este pedido con sus clientes, artículos y pagos? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar pedido',
    })) return
    try {
      await deletePedido(p.id)
      toast.success('Pedido eliminado')
      cargar()
    } catch (err) {
      toast.error(errorMsg(err, 'Error al eliminar'))
    }
  }

  if (loading) return <Cargando />

  const q = busqueda.trim().toLowerCase()
  let filtrados = q
    ? pedidos.filter((p) => {
        const matchNumero = String(p.numero ?? p.id).includes(q)
        const matchFecha  = p.fecha.includes(q) || fechaCorta(p.fecha).toLowerCase().includes(q)
        const matchCliente = p.clientes_nombres?.some((n) => n.toLowerCase().includes(q))
        return matchNumero || matchFecha || matchCliente
      })
    : pedidos

  if (filtroEstado === 'pendientes')  filtrados = filtrados.filter((p) => p.total_pendientes > 0)
  if (filtroEstado === 'completados') filtrados = filtrados.filter((p) => p.total_clientes > 0 && p.total_pendientes === 0)

  const hayFiltro = q || filtroEstado !== 'todos'

  return (
    <div>
      {/* Stats strip */}
      {stats && (
        <div className="bg-ldg-surface border border-ldg-line rounded flex mb-6 overflow-x-auto">
          <StatCell label="Pedidos"    value={stats.total_pedidos} sub="histórico" />
          <StatCell label="Clientes"   value={stats.total_clientes} sub={privado ? `${oculto} con saldo` : `${stats.clientes_con_deuda} con saldo`} />
          <StatCell label="Por cobrar" value={privado ? oculto : `$${stats.total_pendiente.toFixed(2)}`} sub="saldo pendiente" accent="text-ldg-accent" />
          <StatCell label="Cobrado"    value={privado ? oculto : `$${stats.total_cobrado.toFixed(2)}`}   sub="pagos recibidos" accent="text-ldg-success" />
          <StatCell label="Items"      value={stats.total_items ?? 0} sub="entregados + pendientes" />
          <StatCell label="Total general" value={privado ? oculto : `$${(stats.total_general ?? 0).toFixed(2)}`} sub="subtotal + comisiones" darkBg />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div>
          <h1 className="text-lg font-bold text-ldg-ink tracking-tight">Pedidos</h1>
          <p className="text-xs text-ldg-muted mt-0.5" aria-live="polite">
            {hayFiltro ? `${filtrados.length} de ${pedidos.length} pedidos` : `${pedidos.length} pedidos`} · ordenados por fecha
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={revelar}
            aria-pressed={!privado}
            title={privado ? 'Mostrar montos (se ocultan solos en 7 s)' : 'Ocultar montos'}
            className={`text-xs font-mono px-2.5 py-1.5 rounded border transition-colors ${
              privado
                ? 'border-ldg-line text-ldg-muted hover:text-ldg-ink'
                : 'border-ldg-accent text-ldg-accent bg-ldg-accent-soft'
            }`}
          >
            {privado ? 'Mostrar montos' : 'Ocultar montos'}
          </button>
          <div className="ldg-search w-full sm:w-64">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ldg-muted flex-shrink-0" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setParam('q', e.target.value, '')}
              placeholder="cliente, número o fecha…"
              aria-label="Buscar pedidos por cliente, número o fecha"
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent text-sm text-ldg-ink placeholder:text-ldg-muted-soft focus:outline-none"
            />
            {busqueda && (
              <button onClick={() => setParam('q', '', '')} aria-label="Limpiar búsqueda" className="text-ldg-muted hover:text-ldg-ink text-base leading-none">&times;</button>
            )}
          </div>
          <div className="flex border border-ldg-line rounded overflow-hidden font-mono text-xs" role="group" aria-label="Filtrar por estado">
            {FILTROS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setParam('estado', key, 'todos')}
                aria-pressed={filtroEstado === key}
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
          <Link to="/pedidos/nuevo" className="ldg-btn-primary">+ Nuevo pedido</Link>
        </div>
      </div>

      {/* Table */}
      {pedidos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-ldg-line rounded space-y-3">
          <p className="text-ldg-muted text-sm">No hay pedidos aún.</p>
          <Link to="/pedidos/nuevo" className="ldg-btn-primary">+ Crear el primer pedido</Link>
        </div>
      ) : (
        /* ponytail: grid de ancho minimo con scroll horizontal en movil */
        <div className="bg-ldg-surface border border-ldg-line rounded overflow-x-auto">
          <div className="min-w-[720px]">
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
              <span className="sr-only">Acciones</span>
            </div>

            {filtrados.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <p className="text-ldg-muted text-sm">Ningún pedido coincide con la búsqueda o el filtro.</p>
                <button onClick={() => setParams({}, { replace: true })} className="ldg-link text-sm text-ldg-accent">Quitar filtros</button>
              </div>
            )}

            {filtrados.map((p, i) => (
              <div
                key={p.id}
                className={`relative grid gap-3 px-4 py-3.5 text-sm items-center hover:bg-ldg-surface-alt transition-colors ${
                  i < filtrados.length - 1 ? 'border-b border-ldg-line-soft' : ''
                }`}
                style={{ gridTemplateColumns: COL }}
              >
                {/* Enlace "estirado": toda la fila navega, y Ctrl+click abre otra pestaña */}
                <Link
                  to={`/pedidos/${p.id}`}
                  className="font-mono font-bold text-ldg-ink after:absolute after:inset-0 after:content-['']"
                >
                  #{String(p.numero ?? p.id).padStart(3, '0')}
                </Link>
                <span className="font-mono text-ldg-ink-soft text-xs">{fechaCorta(p.fecha)}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {(p.clientes_nombres || []).slice(0, 3).map((n, idx) => (
                      <span
                        key={idx}
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full flex-shrink-0 inline-flex items-center justify-center text-[9px] font-bold text-ldg-ink ${avatarClass(n)}`}
                      >
                        {initials(n)}
                      </span>
                    ))}
                    <span className="text-xs text-ldg-ink truncate">
                      {(p.clientes_nombres || []).length === 0
                        ? <span className="text-ldg-muted italic">sin clientes</span>
                        : (p.clientes_nombres || []).slice(0, 2).join(', ')}
                      {(p.clientes_nombres || []).length > 2 ? ` +${p.clientes_nombres.length - 2}` : ''}
                    </span>
                  </div>
                  {p.notas && <p className="text-[11px] text-ldg-muted italic truncate" title={p.notas}>{p.notas}</p>}
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
                <div className="relative z-10 flex items-center justify-end gap-1 text-[11px]">
                  <button onClick={() => abrirEditar(p)} className="ldg-link">editar</button>
                  <button
                    onClick={() => handleDelete(p)}
                    aria-label={`Eliminar pedido #${String(p.numero ?? p.id).padStart(3, '0')}`}
                    className="ldg-icon-btn hover:text-ldg-danger"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel editar pedido */}
      <SidePanel open={!!panelEditar} onClose={() => setPanelEditar(null)} title="Editar pedido">
        <form onSubmit={handleSaveEditar} className="space-y-4">
          <div>
            <label htmlFor="edit-numero" className="ldg-label">Número</label>
            <input
              id="edit-numero"
              type="number"
              inputMode="numeric"
              value={formEditar.numero}
              onChange={(e) => setFormEditar({ ...formEditar, numero: e.target.value })}
              className="ldg-input font-mono"
            />
          </div>
          <div>
            <label htmlFor="edit-fecha" className="ldg-label">Fecha</label>
            <input
              id="edit-fecha"
              type="date"
              required
              value={formEditar.fecha}
              onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })}
              className="ldg-input font-mono"
            />
          </div>
          <div>
            <label htmlFor="edit-notas" className="ldg-label">Notas</label>
            <input
              id="edit-notas"
              type="text"
              autoComplete="off"
              placeholder="Opcional"
              value={formEditar.notas}
              onChange={(e) => setFormEditar({ ...formEditar, notas: e.target.value })}
              className="ldg-input"
            />
          </div>
          <button type="submit" disabled={guardando} className="ldg-btn-primary w-full py-2">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </SidePanel>
    </div>
  )
}
