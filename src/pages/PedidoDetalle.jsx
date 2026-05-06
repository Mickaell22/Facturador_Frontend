import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SidePanel from '../components/SidePanel'
import ImageUpload from '../components/ImageUpload'
import {
  getPedido, getPedidos, getClientes, addClienteToPedido, removeClienteFromPedido,
  updateComisionPedidoCliente, moverClientePedido,
  createItem, updateItem, deleteItem, uploadItemImagen, deleteItemImagen,
  createPago, deletePago, uploadComprobante,
  exportPedidoExcel,
} from '../api'

const AVATAR_LIGHT = ['#D4B896', '#A8B89F', '#C4A98E', '#9DA8B5', '#B89C9C']
const AVATAR_DARK  = ['#8B6E48', '#6B7C5E', '#8B6F52', '#5E6E80', '#80605F']
const avatarBg = (idx) => {
  const dark = document.documentElement.classList.contains('dark')
  return (dark ? AVATAR_DARK : AVATAR_LIGHT)[idx % 5]
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const ITEM_COL = '36px 52px 1fr 96px 56px 64px'

function StatCell({ label, value, accent, last }) {
  return (
    <div className={`flex-1 min-w-0 px-5 py-3.5 ${last ? '' : 'border-r border-ldg-line'}`}>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">{label}</p>
      <p className={`text-[20px] font-bold font-mono leading-none ${accent || 'text-ldg-ink'}`}>{value}</p>
    </div>
  )
}

export default function PedidoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [pedido, setPedido] = useState(null)
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [panelCliente, setPanelCliente] = useState(false)
  const [panelItem, setPanelItem] = useState(null)
  const [panelPago, setPanelPago] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [busquedaCombo, setBusquedaCombo] = useState('')
  const [comboAbierto, setComboAbierto] = useState(false)
  const [colapsados, setColapsados] = useState(new Set())
  const [editandoComision, setEditandoComision] = useState(null)
  const [comisionInput, setComisionInput] = useState('')
  const [panelEditItem, setPanelEditItem] = useState(null)
  const [formEditItem, setFormEditItem] = useState({ link: '', articulo: '', precio: '' })
  const [formItem, setFormItem] = useState({ link: '', articulo: '', precio: '' })
  const [formPago, setFormPago] = useState({ monto: '', tipo: 'transferencia', notas: '' })
  const [busquedaPedido, setBusquedaPedido] = useState('')
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState('todos')
  const [panelMover, setPanelMover] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [pedidoDestinoId, setPedidoDestinoId] = useState('')

  const handleExport = async () => {
    try {
      const res = await exportPedidoExcel(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Pedido_${pedido?.numero || id}_${pedido?.fecha || ''}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al exportar Excel')
    }
  }

  const cargar = async () => {
    try {
      const [pedidoRes, clientesRes, pedidosRes] = await Promise.all([getPedido(id), getClientes(), getPedidos()])
      setPedido(pedidoRes.data)
      setClientes(clientesRes.data)
      setPedidos(pedidosRes.data)
    } catch {
      toast.error('Error al cargar pedido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  const agregarCliente = async () => {
    if (!clienteSeleccionado) return
    try {
      await addClienteToPedido(id, clienteSeleccionado)
      setClienteSeleccionado('')
      setPanelCliente(false)
      cargar()
    } catch { toast.error('Error al agregar cliente') }
  }

  const quitarCliente = async (clienteId) => {
    if (!confirm('¿Quitar cliente del pedido? Se eliminarán sus items y pagos.')) return
    try { await removeClienteFromPedido(id, clienteId); cargar() }
    catch { toast.error('Error al quitar cliente') }
  }

  const moverCliente = async () => {
    if (!pedidoDestinoId || !panelMover) return
    try {
      await moverClientePedido(id, panelMover.cliente_id, parseInt(pedidoDestinoId))
      setPanelMover(null)
      setPedidoDestinoId('')
      cargar()
      toast.success('Cliente movido al pedido destino')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al mover cliente')
    }
  }

  const guardarComision = async (clienteId) => {
    const val = parseFloat(comisionInput)
    if (isNaN(val) || val < 0) return toast.error('Comisión inválida')
    try {
      await updateComisionPedidoCliente(id, clienteId, val)
      setEditandoComision(null)
      cargar()
    } catch { toast.error('Error al actualizar comisión') }
  }

  const guardarEditItem = async (e, pc) => {
    e.preventDefault()
    if (!formEditItem.precio) return toast.error('El precio es requerido')
    try {
      await updateItem(pc.id, panelEditItem.id, {
        link: formEditItem.link || null,
        articulo: formEditItem.articulo || null,
        precio: parseFloat(formEditItem.precio),
      })
      setPanelEditItem(null)
      cargar()
      toast.success('Artículo actualizado')
    } catch { toast.error('Error al actualizar artículo') }
  }

  const agregarItem = async (e, pc) => {
    e.preventDefault()
    if (!formItem.precio) return toast.error('El precio es requerido')
    try {
      await createItem(pc.id, {
        link: formItem.link || null,
        articulo: formItem.articulo || null,
        precio: parseFloat(formItem.precio),
        numero: pc.items.length + 1,
      })
      setFormItem({ link: '', articulo: '', precio: '' })
      setPanelItem(null)
      cargar()
      toast.success('Item agregado')
    } catch { toast.error('Error al agregar item') }
  }

  const toggleLlegado = async (pc, item) => {
    try { await updateItem(pc.id, item.id, { llegado: !item.llegado }); cargar() }
    catch { toast.error('Error al actualizar item') }
  }

  const eliminarItem = async (pc, itemId) => {
    if (!confirm('¿Eliminar item?')) return
    try { await deleteItem(pc.id, itemId); cargar() }
    catch { toast.error('Error al eliminar item') }
  }

  const subirImagenItem = async (pc, itemId, file) => {
    try { await uploadItemImagen(pc.id, itemId, file); toast.success('Imagen subida'); cargar() }
    catch { toast.error('Error al subir imagen') }
  }

  const eliminarImagenItem = async (pc, itemId) => {
    try { await deleteItemImagen(pc.id, itemId); cargar() }
    catch { toast.error('Error al eliminar imagen') }
  }

  const registrarPago = async (e, pc) => {
    e.preventDefault()
    if (!formPago.monto) return toast.error('El monto es requerido')
    try {
      await createPago(pc.id, { monto: parseFloat(formPago.monto), tipo: formPago.tipo, notas: formPago.notas || null })
      setFormPago({ monto: '', tipo: 'transferencia', notas: '' })
      setPanelPago(null)
      cargar()
      toast.success('Pago registrado')
    } catch { toast.error('Error al registrar pago') }
  }

  const eliminarPago = async (pc, pagoId) => {
    if (!confirm('¿Eliminar pago?')) return
    try { await deletePago(pc.id, pagoId); cargar() }
    catch { toast.error('Error al eliminar pago') }
  }

  const subirComprobante = async (pc, pagoId, file) => {
    try { await uploadComprobante(pc.id, pagoId, file); toast.success('Comprobante subido'); cargar() }
    catch { toast.error('Error al subir comprobante') }
  }

  if (loading) return <p className="text-center py-16 text-ldg-muted text-sm">Cargando...</p>
  if (!pedido)  return <p className="text-center py-16 text-ldg-muted text-sm">Pedido no encontrado</p>

  const clientesEnPedido   = pedido.clientes.map((c) => c.cliente_id)
  const clientesDisponibles = clientes.filter((c) => !clientesEnPedido.includes(c.id))
  const fechaFormateada = new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const resumenPedido = pedido.clientes.reduce(
    (acc, pc) => ({
      porCobrar: acc.porCobrar + Math.max(0, Number(pc.saldo)),
      cobrado:   acc.cobrado   + Number(pc.total_pagado),
      comision:  acc.comision  + Number(pc.comision),
      totalItems: acc.totalItems + pc.items.length,
    }),
    { porCobrar: 0, cobrado: 0, comision: 0, totalItems: 0 }
  )

  const todosColapsados = pedido.clientes.every((pc) => colapsados.has(pc.id))

  const clientesFiltrados = pedido.clientes.filter((pc) => {
    const q = busquedaPedido.trim().toLowerCase()
    if (q && !pc.cliente_nombre.toLowerCase().includes(q)) return false
    if (filtroEstadoPedido === 'pendientes') return Number(pc.saldo) > 0
    if (filtroEstadoPedido === 'pagados')    return Number(pc.saldo) <= 0
    return true
  })

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-ldg-muted mb-2">
        <button onClick={() => navigate('/')} className="hover:text-ldg-ink transition-colors">Pedidos</button>
        <span className="mx-2">/</span>
        <span className="font-mono">#{String(pedido.numero ?? pedido.id).padStart(3, '0')}</span>
      </div>

      {/* Page header */}
      <div className="flex items-end justify-between mb-5 pb-4 border-b border-ldg-line">
        <div>
          <h1 className="text-[28px] font-bold text-ldg-ink tracking-tight">
            <span className="font-mono">#{String(pedido.numero ?? pedido.id).padStart(3, '0')}</span>
            <span className="text-ldg-muted font-normal text-lg ml-3">{fechaFormateada}</span>
          </h1>
          {pedido.notas && <p className="text-sm text-ldg-ink-soft italic mt-1.5">{pedido.notas}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setColapsados(todosColapsados ? new Set() : new Set(pedido.clientes.map((pc) => pc.id)))}
            className="ldg-btn-secondary"
          >
            {todosColapsados ? 'Expandir todo' : 'Contraer todo'}
          </button>
          <button onClick={handleExport} className="ldg-btn-success">Exportar Excel</button>
          <button onClick={() => setPanelCliente(true)} className="ldg-btn-primary">+ Cliente</button>
        </div>
      </div>

      {/* Stats strip */}
      {pedido.clientes.length > 0 && (
        <div className="bg-ldg-surface border border-ldg-line rounded flex mb-5 overflow-hidden">
          <StatCell label="Clientes"   value={pedido.clientes.length} />
          <StatCell label="Items"      value={resumenPedido.totalItems} />
          <StatCell label="Comisión"   value={`$${resumenPedido.comision.toFixed(2)}`}  accent="text-ldg-accent" />
          <StatCell label="Cobrado"    value={`$${resumenPedido.cobrado.toFixed(2)}`}   accent="text-ldg-success" />
          <StatCell label="Por cobrar" value={`$${resumenPedido.porCobrar.toFixed(2)}`} accent={resumenPedido.porCobrar > 0 ? 'text-ldg-accent' : 'text-ldg-success'} last />
        </div>
      )}

      {/* Search/filter bar */}
      {pedido.clientes.length > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-ldg-surface border border-ldg-line rounded px-2.5 py-1.5 flex-1 max-w-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ldg-muted flex-shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={busquedaPedido}
              onChange={(e) => setBusquedaPedido(e.target.value)}
              placeholder="Buscar cliente..."
              className="flex-1 bg-transparent text-sm text-ldg-ink placeholder:text-ldg-muted-soft focus:outline-none"
            />
            {busquedaPedido && (
              <button onClick={() => setBusquedaPedido('')} className="text-ldg-muted hover:text-ldg-ink text-base leading-none">&times;</button>
            )}
          </div>
          <div className="flex border border-ldg-line rounded overflow-hidden font-mono text-xs">
            {[
              { key: 'todos', label: 'todos' },
              { key: 'pendientes', label: 'con saldo' },
              { key: 'pagados', label: 'pagados' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltroEstadoPedido(key)}
                className={`px-3 py-1.5 border-r border-ldg-line last:border-r-0 transition-colors ${
                  filtroEstadoPedido === key
                    ? 'bg-ldg-ink text-ldg-on-ink'
                    : 'bg-ldg-surface text-ldg-ink hover:bg-ldg-surface-alt'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {pedido.clientes.length === 0 && (
        <p className="text-center py-20 text-ldg-muted text-sm">Agrega un cliente para comenzar.</p>
      )}

      {/* Client cards */}
      <div className="space-y-4">
        {clientesFiltrados.map((pc, idx) => {
          const pagado = Number(pc.saldo) <= 0
          const pct = Number(pc.total) > 0 ? Math.min(100, (Number(pc.total_pagado) / Number(pc.total)) * 100) : 0
          const colapsado = colapsados.has(pc.id)

          return (
            <div key={pc.id} className="bg-ldg-surface border border-ldg-line rounded overflow-hidden">
              {/* Client header */}
              <div className="grid gap-3 px-4 py-3 bg-ldg-surface-alt border-b border-ldg-line-soft items-center"
                style={{ gridTemplateColumns: '32px 1fr auto auto' }}>
                <span
                  className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-ldg-ink flex-shrink-0 av-${idx % 5}`}
                >
                  {initials(pc.cliente_nombre)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ldg-ink">{pc.cliente_nombre}</span>
                    {editandoComision === pc.cliente_id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); guardarComision(pc.cliente_id) }}
                        className="flex items-center gap-1"
                      >
                        <span className="text-xs text-ldg-muted font-mono">$</span>
                        <input
                          type="number" step="0.01" min="0"
                          value={comisionInput}
                          onChange={(e) => setComisionInput(e.target.value)}
                          autoFocus
                          className="w-14 border border-ldg-accent rounded px-1 py-0.5 text-xs font-mono text-ldg-ink bg-ldg-bg focus:outline-none"
                        />
                        <span className="text-xs text-ldg-muted font-mono">/item</span>
                        <button type="submit" className="text-xs text-ldg-accent font-semibold hover:underline">OK</button>
                        <button type="button" onClick={() => setEditandoComision(null)} className="text-xs text-ldg-muted hover:underline">×</button>
                      </form>
                    ) : (
                      <button
                        onClick={() => { setEditandoComision(pc.cliente_id); setComisionInput(String(Number(pc.cliente_comision))) }}
                        className="text-[11px] font-mono text-ldg-muted hover:text-ldg-accent transition-colors"
                      >
                        comisión ${Number(pc.cliente_comision).toFixed(2)}/item · {pc.items.length} items · {pc.items.filter(i => i.llegado).length} llegados
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <div className="text-right">
                    <div className="text-[10px] text-ldg-muted uppercase tracking-widest">Total</div>
                    <div className="font-bold text-[15px] text-ldg-ink">${Number(pc.total).toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-ldg-muted uppercase tracking-widest">Saldo</div>
                    <div className={`font-bold text-[15px] ${pagado ? 'text-ldg-success' : 'text-ldg-accent'}`}>
                      ${Number(pc.saldo).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <button
                    onClick={() => { sessionStorage.setItem('pedido_id_para_factura', id); navigate(`/factura/${pc.id}`) }}
                    className="text-ldg-muted hover:text-ldg-accent transition-colors"
                  >
                    factura
                  </button>
                  {pc.token_publico && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/p/${pc.token_publico}`
                        const itemsTexto = pc.items
                          .map((i) => `• ${i.articulo || `Item #${i.numero}`}: $${Number(i.precio).toFixed(2)}`)
                          .join('\n')
                        const mensaje = [
                          `*${pc.cliente_nombre}* — Pedido #${pedido.numero ?? pedido.id}`,
                          '', itemsTexto || '(sin artículos)', '',
                          `Subtotal: $${Number(pc.subtotal).toFixed(2)}`,
                          `Comisión: $${Number(pc.comision).toFixed(2)}`,
                          `*Total: $${Number(pc.total).toFixed(2)}*`,
                          Number(pc.total_pagado) > 0 ? `Pagado: -$${Number(pc.total_pagado).toFixed(2)}` : null,
                          `*Saldo: $${Number(pc.saldo).toFixed(2)}*`, '',
                          'Ten en cuenta que al momento de hacer la compra los precios pueden subir o bajar.', '',
                          url,
                        ].filter((l) => l !== null).join('\n')
                        navigator.clipboard.writeText(mensaje).then(() => toast.success('Mensaje copiado'))
                      }}
                      className="text-ldg-muted hover:text-ldg-accent transition-colors"
                    >
                      copiar
                    </button>
                  )}
                  <button
                    onClick={() => { setPanelMover(pc); setPedidoDestinoId('') }}
                    className="text-ldg-muted hover:text-ldg-accent transition-colors"
                  >
                    mover
                  </button>
                  <button onClick={() => quitarCliente(pc.cliente_id)} className="text-ldg-muted hover:text-ldg-danger transition-colors">quitar</button>
                  <button
                    onClick={() => setColapsados((prev) => {
                      const next = new Set(prev)
                      next.has(pc.id) ? next.delete(pc.id) : next.add(pc.id)
                      return next
                    })}
                    className="text-ldg-muted hover:text-ldg-ink transition-colors text-base leading-none"
                  >
                    {colapsado ? '▸' : '▾'}
                  </button>
                </div>
              </div>

              {!colapsado && (
                <>
                  {/* Items table header */}
                  <div
                    className="grid gap-3 px-4 py-2 text-[10px] font-semibold tracking-widest uppercase text-ldg-muted border-b border-ldg-line-soft"
                    style={{ gridTemplateColumns: ITEM_COL }}
                  >
                    <span>#</span><span></span><span>Artículo</span>
                    <span className="text-right">Precio</span>
                    <span className="text-center">Llegó</span><span></span>
                  </div>

                  {/* Items */}
                  {pc.items.length === 0 && (
                    <div className="px-4 py-3 text-xs text-ldg-muted italic">Sin artículos aún.</div>
                  )}
                  {pc.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 px-4 py-2.5 items-center border-b border-ldg-line-soft"
                      style={{ gridTemplateColumns: ITEM_COL }}
                    >
                      <span className="font-mono text-ldg-muted text-xs">{String(item.numero).padStart(2, '0')}</span>
                      <ImageUpload
                        imageUrl={item.imagen_url}
                        onUpload={(file) => subirImagenItem(pc, item.id, file)}
                        onDelete={item.imagen_url ? () => eliminarImagenItem(pc, item.id) : undefined}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-ldg-ink truncate">{item.articulo || <span className="text-ldg-muted">Item #{item.numero}</span>}</p>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] text-ldg-accent hover:underline truncate block">
                            ↗ ver enlace
                          </a>
                        )}
                      </div>
                      <span className="text-right font-mono font-semibold text-sm text-ldg-ink">${Number(item.precio).toFixed(2)}</span>
                      <span className="text-center">
                        <button
                          onClick={() => toggleLlegado(pc, item)}
                          title={item.llegado ? 'Llegó' : 'Marcar como llegado'}
                          className={`w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[11px] font-bold transition-colors ${
                            item.llegado
                              ? 'bg-ldg-success text-ldg-on-ink'
                              : 'border-[1.5px] border-dashed border-ldg-muted-soft text-transparent'
                          }`}
                        >
                          {item.llegado ? '✓' : '·'}
                        </button>
                      </span>
                      <div className="flex items-center justify-end gap-2 text-[11px] text-ldg-muted">
                        <button
                          onClick={() => {
                            setPanelEditItem({ ...item, _pc: pc })
                            setFormEditItem({ link: item.link || '', articulo: item.articulo || '', precio: String(item.precio || '') })
                          }}
                          className="hover:text-ldg-accent transition-colors"
                        >
                          editar
                        </button>
                        <button onClick={() => eliminarItem(pc, item.id)} className="hover:text-ldg-danger transition-colors">×</button>
                      </div>
                    </div>
                  ))}

                  {/* Add item row */}
                  <div className="px-4 py-2.5 border-b border-ldg-line">
                    <button
                      onClick={() => { setFormItem({ link: '', articulo: '', precio: '' }); setPanelItem(pc) }}
                      className="text-xs font-semibold text-ldg-accent tracking-wide hover:underline"
                    >
                      + AGREGAR ARTÍCULO
                    </button>
                  </div>

                  {/* Footer: pagos | totals */}
                  <div className="grid grid-cols-2 border-t border-ldg-line">
                    {/* Pagos */}
                    <div className="px-4 py-3 border-r border-ldg-line bg-ldg-surface-alt">
                      <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-2">
                        Pagos ({pc.pagos.length})
                      </div>
                      {pc.pagos.length === 0 ? (
                        <p className="text-xs text-ldg-muted-soft italic">Sin pagos registrados</p>
                      ) : (
                        <div className="space-y-1.5">
                          {pc.pagos.map((pago) => (
                            <div key={pago.id} className="flex items-center gap-2">
                              <ImageUpload imageUrl={pago.comprobante_url} onUpload={(file) => subirComprobante(pc, pago.id, file)} label="comp." />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-mono text-ldg-ink-soft truncate">
                                    {pago.fecha} · {pago.tipo}{pago.notas ? ` (${pago.notas})` : ''}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-ldg-success flex-shrink-0">+${Number(pago.monto).toFixed(2)}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => eliminarPago(pc, pago.id)}
                                className="text-ldg-muted hover:text-ldg-danger text-sm flex-shrink-0 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => { setFormPago({ monto: '', tipo: 'transferencia', notas: '' }); setPanelPago(pc) }}
                        className="mt-2.5 text-[11px] font-semibold text-ldg-accent tracking-wide hover:underline"
                      >
                        + REGISTRAR PAGO
                      </button>
                    </div>

                    {/* Totals + progress */}
                    <div className="px-4 py-3">
                      <div className="space-y-1 text-xs font-mono mb-3">
                        <div className="flex justify-between text-ldg-ink-soft">
                          <span>subtotal</span><span>${Number(pc.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-ldg-ink-soft">
                          <span>comisión</span><span>${Number(pc.comision).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-ldg-ink font-bold pt-1 border-t border-ldg-line-soft">
                          <span>total</span><span>${Number(pc.total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-ldg-success">
                          <span>pagado</span><span>−${Number(pc.total_pagado).toFixed(2)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="h-1 bg-ldg-line-soft rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pagado ? 'bg-ldg-success' : 'bg-ldg-accent'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] font-mono text-ldg-muted">
                          <span>{pct.toFixed(0)}% pagado</span>
                          <span className={`font-bold ${pagado ? 'text-ldg-success' : 'text-ldg-accent'}`}>
                            {pagado ? 'COMPLETADO' : `saldo $${Number(pc.saldo).toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Panel: agregar cliente */}
      <SidePanel
        open={panelCliente}
        onClose={() => { setPanelCliente(false); setBusquedaCombo(''); setComboAbierto(false); setClienteSeleccionado('') }}
        title="Agregar cliente al pedido"
      >
        {clientesDisponibles.length === 0 ? (
          <p className="text-sm text-ldg-muted">Todos los clientes ya están en este pedido.</p>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busquedaCombo}
                onChange={(e) => { setBusquedaCombo(e.target.value); setComboAbierto(true); setClienteSeleccionado('') }}
                onFocus={() => setComboAbierto(true)}
                className="ldg-input"
              />
              {clienteSeleccionado && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ldg-success text-xs font-semibold">✓</span>
              )}
              {comboAbierto && (
                <div className="absolute z-10 w-full mt-1 bg-ldg-surface border border-ldg-line rounded shadow-lg max-h-60 overflow-y-auto">
                  {clientesDisponibles
                    .filter((c) => c.nombre.toLowerCase().includes(busquedaCombo.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => {
                          setClienteSeleccionado(String(c.id))
                          setBusquedaCombo(c.nombre)
                          setComboAbierto(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-ldg-ink hover:bg-ldg-surface-alt transition-colors"
                      >
                        {c.nombre}
                      </button>
                    ))}
                  {clientesDisponibles.filter((c) => c.nombre.toLowerCase().includes(busquedaCombo.toLowerCase())).length === 0 && (
                    <p className="px-4 py-2 text-sm text-ldg-muted">Sin resultados</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => { agregarCliente(); setBusquedaCombo(''); setComboAbierto(false) }}
              disabled={!clienteSeleccionado}
              className="ldg-btn-primary w-full py-2 disabled:opacity-40"
            >
              Agregar
            </button>
          </>
        )}
      </SidePanel>

      {/* Panel: agregar item */}
      <SidePanel
        open={!!panelItem}
        onClose={() => setPanelItem(null)}
        title={panelItem ? `Nuevo artículo — ${panelItem.cliente_nombre}` : ''}
      >
        {panelItem && (
          <form onSubmit={(e) => agregarItem(e, panelItem)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Link del artículo</label>
              <input type="text" placeholder="https://..." value={formItem.link} onChange={(e) => setFormItem({ ...formItem, link: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Nombre del artículo</label>
              <input type="text" placeholder="Opcional" value={formItem.articulo} onChange={(e) => setFormItem({ ...formItem, articulo: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Precio <span className="text-ldg-danger">*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={formItem.precio} onChange={(e) => setFormItem({ ...formItem, precio: e.target.value })} required className="ldg-input font-mono" />
            </div>
            <button type="submit" className="ldg-btn-primary w-full py-2">Agregar artículo</button>
          </form>
        )}
      </SidePanel>

      {/* Panel: registrar pago */}
      <SidePanel
        open={!!panelPago}
        onClose={() => setPanelPago(null)}
        title={panelPago ? `Registrar pago — ${panelPago.cliente_nombre}` : ''}
      >
        {panelPago && (
          <form onSubmit={(e) => registrarPago(e, panelPago)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Monto <span className="text-ldg-danger">*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={formPago.monto} onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })} required className="ldg-input font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Tipo</label>
              <select value={formPago.tipo} onChange={(e) => setFormPago({ ...formPago, tipo: e.target.value })} className="ldg-select w-full">
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Notas</label>
              <input type="text" placeholder="Opcional" value={formPago.notas} onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })} className="ldg-input" />
            </div>
            <button type="submit" className="ldg-btn-primary w-full py-2">Registrar pago</button>
          </form>
        )}
      </SidePanel>

      {/* Panel: editar item */}
      <SidePanel
        open={!!panelEditItem}
        onClose={() => setPanelEditItem(null)}
        title={panelEditItem ? `Editar artículo — ${panelEditItem._pc?.cliente_nombre ?? ''}` : ''}
      >
        {panelEditItem && (
          <form onSubmit={(e) => guardarEditItem(e, panelEditItem._pc)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Link del artículo</label>
              <input type="text" placeholder="https://..." value={formEditItem.link} onChange={(e) => setFormEditItem({ ...formEditItem, link: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Nombre del artículo</label>
              <input type="text" placeholder="Opcional" value={formEditItem.articulo} onChange={(e) => setFormEditItem({ ...formEditItem, articulo: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Precio <span className="text-ldg-danger">*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={formEditItem.precio} onChange={(e) => setFormEditItem({ ...formEditItem, precio: e.target.value })} required className="ldg-input font-mono" />
            </div>
            <button type="submit" className="ldg-btn-primary w-full py-2">Guardar cambios</button>
          </form>
        )}
      </SidePanel>

      {/* Panel: mover cliente a otro pedido */}
      <SidePanel
        open={!!panelMover}
        onClose={() => { setPanelMover(null); setPedidoDestinoId('') }}
        title={panelMover ? `Mover cliente — ${panelMover.cliente_nombre}` : ''}
      >
        {panelMover && (
          <div className="space-y-4">
            <p className="text-xs text-ldg-muted leading-relaxed">
              Selecciona el pedido al que quieres mover a <strong className="text-ldg-ink">{panelMover.cliente_nombre}</strong>. Sus artículos y pagos se trasladarán al pedido destino.
            </p>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">Pedido destino</label>
              <select
                value={pedidoDestinoId}
                onChange={(e) => setPedidoDestinoId(e.target.value)}
                className="ldg-select w-full"
              >
                <option value="">Seleccionar pedido...</option>
                {pedidos
                  .filter((p) => p.id !== parseInt(id))
                  .map((p) => {
                    const fecha = new Date(p.fecha + 'T00:00:00').toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
                    return (
                      <option key={p.id} value={p.id}>
                        #{String(p.numero ?? p.id).padStart(3, '0')} — {fecha}
                      </option>
                    )
                  })}
              </select>
            </div>
            {panelMover.pagos.length > 0 && (
              <p className="text-[11px] text-ldg-accent font-mono">
                Este cliente tiene {panelMover.pagos.length} pago(s) registrado(s) que también se moverán.
              </p>
            )}
            <button
              onClick={moverCliente}
              disabled={!pedidoDestinoId}
              className="ldg-btn-primary w-full py-2 disabled:opacity-40"
            >
              Mover cliente
            </button>
          </div>
        )}
      </SidePanel>
    </div>
  )
}
