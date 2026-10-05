import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import SidePanel from '../components/SidePanel'
import Cargando from '../components/Cargando'
import { getClientes, createCliente, updateCliente, deleteCliente, addAlias, deleteAlias, errorMsg } from '../api'
import { initials, avatarClass } from '../utils/avatar'
import { useConfirm } from '../context/ConfirmContext'

const COL = '40px 1fr 110px 80px 72px'
const formVacio = { nombre: '', comision_por_item: '0.50' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formVacio)
  const [nuevoAlias, setNuevoAlias] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('az')
  const confirm = useConfirm()

  const cargar = async () => {
    try {
      const { data } = await getClientes()
      setClientes(data)
      return data
    } catch (err) {
      toast.error(errorMsg(err, 'Error al cargar clientes'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo  = () => { setEditando(null); setForm(formVacio); setNuevoAlias(''); setPanelAbierto(true) }
  const abrirEditar = (c) => { setEditando(c); setForm({ nombre: c.nombre, comision_por_item: String(c.comision_por_item) }); setNuevoAlias(''); setPanelAbierto(true) }
  const cerrarPanel = () => { setPanelAbierto(false); setEditando(null); setForm(formVacio) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (guardando) return
    const datos = { nombre: form.nombre.trim(), comision_por_item: parseFloat(form.comision_por_item) || 0 }
    setGuardando(true)
    try {
      if (editando) {
        await updateCliente(editando.id, datos)
        toast.success('Cliente actualizado')
      } else {
        await createCliente(datos)
        toast.success('Cliente creado')
      }
      cerrarPanel(); cargar()
    } catch (err) {
      toast.error(errorMsg(err, 'Error al guardar cliente'))
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (c) => {
    if (!await confirm({
      title: `Eliminar a ${c.nombre}`,
      message: 'Solo es posible si no tiene pedidos asociados. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
    })) return
    try { await deleteCliente(c.id); toast.success('Cliente eliminado'); cargar() }
    catch (err) { toast.error(errorMsg(err, 'Error al eliminar')) }
  }

  // Los alias se gestionan dentro del panel de edicion; se refresca `editando`
  // para que la lista del panel muestre el cambio al instante.
  const refrescarEditando = (data) => {
    if (!data || !editando) return
    setEditando(data.find((c) => c.id === editando.id) ?? editando)
  }

  const handleAgregarAlias = async () => {
    const alias = nuevoAlias.trim()
    if (!alias || !editando) return
    try {
      await addAlias(editando.id, alias)
      setNuevoAlias('')
      refrescarEditando(await cargar())
    } catch (err) {
      toast.error(errorMsg(err, `No se pudo agregar el alias "${alias}" (puede que ya exista)`))
    }
  }

  const handleEliminarAlias = async (aliasId) => {
    try { await deleteAlias(editando.id, aliasId); refrescarEditando(await cargar()) }
    catch (err) { toast.error(errorMsg(err, 'Error al eliminar alias')) }
  }

  if (loading) return <Cargando />

  const q = busqueda.trim().toLowerCase()
  const filtrados = clientes
    .filter((c) => !q || c.nombre.toLowerCase().includes(q) || c.aliases.some((a) => a.alias.toLowerCase().includes(q)))
    .sort((a, b) => {
      if (orden === 'az') return a.nombre.localeCompare(b.nombre, 'es')
      if (orden === 'za') return b.nombre.localeCompare(a.nombre, 'es')
      if (orden === 'comision_asc')  return Number(a.comision_por_item) - Number(b.comision_por_item)
      if (orden === 'comision_desc') return Number(b.comision_por_item) - Number(a.comision_por_item)
      return 0
    })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div>
          <h1 className="text-lg font-bold text-ldg-ink tracking-tight">Clientes</h1>
          <p className="text-xs text-ldg-muted mt-0.5" aria-live="polite">
            {q ? `${filtrados.length} de ${clientes.length} clientes` : `${clientes.length} clientes`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="ldg-search w-full sm:w-64">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ldg-muted flex-shrink-0" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="nombre o alias…"
              aria-label="Buscar clientes por nombre o alias"
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent text-sm text-ldg-ink placeholder:text-ldg-muted-soft focus:outline-none"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="text-ldg-muted hover:text-ldg-ink text-base leading-none">&times;</button>
            )}
          </div>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            aria-label="Ordenar clientes"
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
        <div className="text-center py-16 border border-dashed border-ldg-line rounded space-y-3">
          <p className="text-ldg-muted text-sm">No hay clientes aún.</p>
          <button onClick={abrirNuevo} className="ldg-btn-primary">+ Crear el primer cliente</button>
        </div>
      ) : (
        <div className="bg-ldg-surface border border-ldg-line rounded overflow-x-auto">
          <div className="min-w-[520px]">
            <div
              className="grid gap-3 px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-ldg-muted bg-ldg-surface-alt border-b border-ldg-line items-center"
              style={{ gridTemplateColumns: COL }}
            >
              <span></span>
              <span>Nombre</span>
              <span className="text-right">Comisión/item</span>
              <span className="text-center">Pedidos</span>
              <span className="sr-only">Acciones</span>
            </div>

            {filtrados.length === 0 && (
              <p className="text-center py-8 text-ldg-muted text-sm">Ningún cliente coincide con “{busqueda}”.</p>
            )}

            {filtrados.map((c, i) => (
              <div
                key={c.id}
                className={`relative grid gap-3 px-4 py-3 items-center hover:bg-ldg-surface-alt transition-colors ${i < filtrados.length - 1 ? 'border-b border-ldg-line-soft' : ''}`}
                style={{ gridTemplateColumns: COL }}
              >
                <span
                  aria-hidden="true"
                  className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-ldg-ink flex-shrink-0 ${avatarClass(c.nombre)}`}
                >
                  {initials(c.nombre)}
                </span>
                <div className="min-w-0">
                  {/* Enlace estirado: toda la fila abre el historial */}
                  <Link to={`/clientes/${c.id}`} className="text-sm font-semibold text-ldg-ink break-words after:absolute after:inset-0 after:content-['']">
                    {c.nombre}
                  </Link>
                  {c.aliases.length > 0 && (
                    <p className="text-[11px] text-ldg-muted truncate" title={c.aliases.map((a) => a.alias).join(', ')}>
                      también: {c.aliases.map((a) => a.alias).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-right font-mono text-sm text-ldg-ink-soft">${Number(c.comision_por_item).toFixed(2)}</span>
                <span className="text-center font-mono text-xs text-ldg-muted">{c.total_pedidos ?? '—'}</span>
                <div className="relative z-10 flex items-center justify-end gap-1 text-[11px]">
                  <button onClick={() => abrirEditar(c)} className="ldg-link">editar</button>
                  <button onClick={() => handleEliminar(c)} aria-label={`Eliminar a ${c.nombre}`} className="ldg-icon-btn hover:text-ldg-danger">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SidePanel open={panelAbierto} onClose={cerrarPanel} title={editando ? `Editar — ${editando.nombre}` : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cli-nombre" className="ldg-label">Nombre <span className="text-ldg-danger">*</span></label>
            <input
              id="cli-nombre"
              type="text"
              autoComplete="off"
              placeholder="Ej: María Pérez"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              className="ldg-input"
            />
          </div>
          <div>
            <label htmlFor="cli-comision" className="ldg-label">Comisión por item ($)</label>
            <input
              id="cli-comision"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={form.comision_por_item}
              onChange={(e) => setForm({ ...form, comision_por_item: e.target.value })}
              className="ldg-input font-mono"
            />
            <p className="text-xs text-ldg-muted mt-1">Usa 0 si no cobras comisión.</p>
          </div>
          <button type="submit" disabled={guardando} className="ldg-btn-primary w-full py-2">
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </form>

        {editando && (
          <div className="pt-4 border-t border-ldg-line space-y-2">
            <p className="ldg-label">Alias</p>
            <p className="text-xs text-ldg-muted">Otros nombres con los que aparece este cliente; sirven para encontrarlo al buscar.</p>
            {editando.aliases.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {editando.aliases.map((a) => (
                  <li key={a.id} className="inline-flex items-center gap-1 bg-ldg-surface-alt border border-ldg-line text-xs text-ldg-ink-soft pl-2 rounded">
                    {a.alias}
                    <button
                      type="button"
                      onClick={() => handleEliminarAlias(a.id)}
                      aria-label={`Quitar alias ${a.alias}`}
                      className="ldg-icon-btn w-6 h-6 hover:text-ldg-danger"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                autoComplete="off"
                aria-label="Nuevo alias"
                placeholder="Nuevo alias…"
                value={nuevoAlias}
                onChange={(e) => setNuevoAlias(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarAlias() } }}
                className="ldg-input"
              />
              <button type="button" onClick={handleAgregarAlias} disabled={!nuevoAlias.trim()} className="ldg-btn-secondary">Agregar</button>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  )
}
