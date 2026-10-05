import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import SidePanel from '../components/SidePanel'
import ImageUpload from '../components/ImageUpload'
import Cargando from '../components/Cargando'
import {
  getPedido, getPedidos, getClientes, createCliente, addClienteToPedido, removeClienteFromPedido,
  updateComisionPedidoCliente, moverClientePedido,
  createItem, updateItem, deleteItem, uploadItemImagen, deleteItemImagen, moverItems,
  createPago, deletePago, uploadComprobante, deleteComprobante,
  exportPedidoExcel, errorMsg,
} from '../api'
import { initials, avatarClass } from '../utils/avatar'
import { fechaCorta, fechaLarga, fechaHora } from '../utils/fecha'
import { useConfirm } from '../context/ConfirmContext'

const ITEM_COL = '36px 52px 1fr 96px 56px 64px'
const itemVacio = { link: '', articulo: '', precio: '', file: null, preview: null }
const pagoVacio = { monto: '', tipo: 'transferencia', notas: '', file: null, preview: null }
const numPedido = (p) => `#${String(p.numero ?? p.id).padStart(3, '0')}`

function StatCell({ label, value, accent, last }) {
  return (
    <div className={`flex-1 min-w-[120px] px-5 py-3.5 ${last ? '' : 'border-r border-ldg-line'}`}>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">{label}</p>
      <p className={`text-[20px] font-bold font-mono leading-none ${accent || 'text-ldg-ink'}`}>{value}</p>
    </div>
  )
}

// Menu "⋯" para las acciones secundarias de cada cliente del pedido
function MenuAcciones({ label, abierto, onToggle, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!abierto) return
    const click = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    const key = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key) }
  }, [abierto, onClose])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="ldg-icon-btn text-lg leading-none"
      >
        ⋯
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-20 min-w-[190px] bg-ldg-surface border border-ldg-line rounded shadow-lg py-1 animate-ldg-fade">
          {children}
        </div>
      )}
    </div>
  )
}

function ItemMenu({ onClick, danger, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-ldg-surface-alt transition-colors ${danger ? 'text-ldg-danger' : 'text-ldg-ink'}`}
    >
      {children}
    </button>
  )
}

export default function PedidoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [pedido, setPedido] = useState(null)
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(null)

  const [panelCliente, setPanelCliente] = useState(false)
  const [busquedaCombo, setBusquedaCombo] = useState('')
  const [comboIdx, setComboIdx] = useState(0)

  const [panelItem, setPanelItem] = useState(null)
  const [formItem, setFormItem] = useState(itemVacio)
  const [agregadosPanel, setAgregadosPanel] = useState(0)
  const primerCampoItem = useRef(null)

  const [panelEditItem, setPanelEditItem] = useState(null)
  const [formEditItem, setFormEditItem] = useState({ link: '', articulo: '', precio: '' })

  const [panelPago, setPanelPago] = useState(null)
  const [formPago, setFormPago] = useState(pagoVacio)

  const [colapsados, setColapsados] = useState(new Set())
  const [editandoComision, setEditandoComision] = useState(null)
  const [comisionInput, setComisionInput] = useState('')
  const [busquedaPedido, setBusquedaPedido] = useState('')
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState('todos')

  const [panelMover, setPanelMover] = useState(null)
  const [pedidoDestinoId, setPedidoDestinoId] = useState('')
  const [panelMoverItems, setPanelMoverItems] = useState(null)
  const [itemsSeleccionados, setItemsSeleccionados] = useState(new Set())
  const [moverDestPedidoId, setMoverDestPedidoId] = useState('')
  const [moverDestPedido, setMoverDestPedido] = useState(null)
  const [moverDestPcId, setMoverDestPcId] = useState('')
  const [confirmMover, setConfirmMover] = useState('')

  // Carga inicial: pedido + catalogos para los paneles
  const cargar = async () => {
    try {
      const [pedidoRes, clientesRes, pedidosRes] = await Promise.all([getPedido(id), getClientes(), getPedidos()])
      setPedido(pedidoRes.data)
      setClientes(clientesRes.data)
      setPedidos(pedidosRes.data)
    } catch (err) {
      toast.error(errorMsg(err, 'Error al cargar pedido'))
    } finally {
      setLoading(false)
    }
  }

  // Tras cada cambio solo hace falta el pedido (totales los calcula el backend)
  const recargar = async () => {
    try {
      const { data } = await getPedido(id)
      setPedido(data)
    } catch (err) {
      toast.error(errorMsg(err, 'Error al recargar el pedido'))
    }
  }

  useEffect(() => { cargar() }, [id])

  // Envuelve una accion: bloquea doble envio y muestra el error del backend
  const ejecutar = async (fn, msgError) => {
    if (guardando) return false
    setGuardando(true)
    try { await fn(); return true }
    catch (err) { toast.error(errorMsg(err, msgError)); return false }
    finally { setGuardando(false) }
  }

  const handleExport = async () => {
    setExportando(true)
    try {
      const res = await exportPedidoExcel(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Pedido_${pedido?.numero || id}_${pedido?.fecha || ''}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(errorMsg(err, 'Error al exportar Excel'))
    } finally {
      setExportando(false)
    }
  }

  // ── Clientes ───────────────────────────────────────
  const cerrarPanelCliente = () => { setPanelCliente(false); setBusquedaCombo(''); setComboIdx(0) }

  const agregarCliente = (cliente) => ejecutar(async () => {
    await addClienteToPedido(id, cliente.id)
    toast.success(`${cliente.nombre} agregado`)
    cerrarPanelCliente()
    await recargar()
  }, 'Error al agregar cliente')

  const crearYAgregarCliente = (nombre) => ejecutar(async () => {
    const { data: nuevo } = await createCliente({ nombre })
    setClientes((prev) => [...prev, nuevo])
    await addClienteToPedido(id, nuevo.id)
    toast.success(`Cliente ${nuevo.nombre} creado y agregado`)
    cerrarPanelCliente()
    await recargar()
  }, 'Error al crear cliente')

  const quitarCliente = async (pc) => {
    if (!await confirm({
      title: 'Quitar cliente del pedido',
      message: `Se eliminarán los ítems y pagos de ${pc.cliente_nombre} en este pedido. Esta acción no se puede deshacer.`,
      confirmText: 'Quitar cliente',
    })) return
    if (await ejecutar(() => removeClienteFromPedido(id, pc.cliente_id), 'Error al quitar cliente')) {
      toast.success(`${pc.cliente_nombre} quitado del pedido`)
      recargar()
    }
  }

  const moverCliente = async () => {
    if (!pedidoDestinoId || !panelMover) return
    const ok = await ejecutar(
      () => moverClientePedido(id, panelMover.cliente_id, parseInt(pedidoDestinoId)),
      'Error al mover cliente',
    )
    if (ok) {
      setPanelMover(null)
      setPedidoDestinoId('')
      toast.success('Cliente movido al pedido destino')
      recargar()
    }
  }

  const guardarComision = async (clienteId) => {
    const val = parseFloat(comisionInput)
    if (isNaN(val) || val < 0) return toast.error('Comisión inválida: usa un número mayor o igual a 0')
    if (await ejecutar(() => updateComisionPedidoCliente(id, clienteId, val), 'Error al actualizar comisión')) {
      setEditandoComision(null)
      recargar()
    }
  }

  // ── Mover articulos ───────────────────────────────
  const abrirMoverItems = (pc) => {
    setPanelMoverItems(pc)
    setItemsSeleccionados(new Set())
    setMoverDestPedidoId(String(id))
    setMoverDestPedido(pedido)
    setMoverDestPcId('')
    setConfirmMover('')
  }

  const cambiarPedidoDestino = async (destId) => {
    setMoverDestPedidoId(destId)
    setMoverDestPcId('')
    if (destId === String(id)) { setMoverDestPedido(pedido); return }
    try {
      const res = await getPedido(destId)
      setMoverDestPedido(res.data)
    } catch (err) {
      toast.error(errorMsg(err, 'Error al cargar el pedido destino'))
      setMoverDestPedido(null)
    }
  }

  const toggleSeleccionItem = (itemId) => setItemsSeleccionados((prev) => {
    const next = new Set(prev)
    next.has(itemId) ? next.delete(itemId) : next.add(itemId)
    return next
  })

  const ejecutarMoverItems = async () => {
    if (itemsSeleccionados.size === 0) return toast.error('Selecciona al menos un artículo')
    if (!moverDestPcId) return toast.error('Selecciona el cliente destino')
    if (confirmMover.trim().toUpperCase() !== 'MOVER') return toast.error('Escribe MOVER para confirmar')
    let movidos = 0
    const ok = await ejecutar(async () => {
      const res = await moverItems(panelMoverItems.id, [...itemsSeleccionados], parseInt(moverDestPcId))
      movidos = res.data.movidos
    }, 'Error al mover artículos')
    if (ok) {
      setPanelMoverItems(null)
      toast.success(`${movidos} artículo(s) movido(s)`)
      recargar()
    }
  }

  // ── Articulos ─────────────────────────────────────
  const abrirNuevoItem = (pc) => {
    setFormItem(itemVacio)
    setAgregadosPanel(0)
    setPanelItem(pc)
  }

  const cerrarNuevoItem = () => {
    if (formItem.preview) URL.revokeObjectURL(formItem.preview)
    setFormItem(itemVacio)
    setPanelItem(null)
  }

  const elegirFotoNueva = (file) => {
    if (formItem.preview) URL.revokeObjectURL(formItem.preview)
    setFormItem((f) => ({ ...f, file, preview: URL.createObjectURL(file) }))
  }

  const quitarFotoNueva = () => {
    if (formItem.preview) URL.revokeObjectURL(formItem.preview)
    setFormItem((f) => ({ ...f, file: null, preview: null }))
  }

  // El panel queda abierto tras agregar: se cargan varios articulos seguidos
  // (link, foto pegada y precio) sin volver a abrirlo.
  const agregarItem = async (e) => {
    e.preventDefault()
    if (!formItem.precio) return toast.error('El precio es requerido')
    const pc = pedido.clientes.find((c) => c.id === panelItem.id) ?? panelItem
    const ok = await ejecutar(async () => {
      const numero = pc.items.reduce((m, i) => Math.max(m, i.numero ?? 0), 0) + 1
      const { data: item } = await createItem(pc.id, {
        link: formItem.link.trim() || null,
        articulo: formItem.articulo.trim() || null,
        precio: parseFloat(formItem.precio),
        numero,
      })
      if (formItem.file) {
        try { await uploadItemImagen(pc.id, item.id, formItem.file) }
        catch (err) { toast.error(errorMsg(err, 'Artículo creado, pero la foto no se pudo subir. Pégala en la fila.')) }
      }
      await recargar()
    }, 'Error al agregar artículo')
    if (ok) {
      if (formItem.preview) URL.revokeObjectURL(formItem.preview)
      setFormItem(itemVacio)
      setAgregadosPanel((n) => n + 1)
      toast.success('Artículo agregado')
      primerCampoItem.current?.focus()
    }
  }

  const guardarEditItem = async (e) => {
    e.preventDefault()
    if (!formEditItem.precio) return toast.error('El precio es requerido')
    const pc = panelEditItem._pc
    const ok = await ejecutar(() => updateItem(pc.id, panelEditItem.id, {
      link: formEditItem.link.trim() || null,
      articulo: formEditItem.articulo.trim() || null,
      precio: parseFloat(formEditItem.precio),
    }), 'Error al actualizar artículo')
    if (ok) {
      setPanelEditItem(null)
      toast.success('Artículo actualizado')
      recargar()
    }
  }

  // Optimista: el check cambia al instante; el backend recalcula totales despues
  const toggleActivo = async (pc, item) => {
    setPedido((p) => ({
      ...p,
      clientes: p.clientes.map((c) => c.id !== pc.id ? c : {
        ...c, items: c.items.map((i) => i.id === item.id ? { ...i, activo: !i.activo } : i),
      }),
    }))
    try { await updateItem(pc.id, item.id, { activo: !item.activo }) }
    catch (err) { toast.error(errorMsg(err, 'Error al actualizar artículo')) }
    recargar()
  }

  const eliminarItem = async (pc, item) => {
    if (!await confirm({
      title: 'Eliminar artículo',
      message: `¿Eliminar "${item.articulo || `Item #${item.numero}`}" de ${pc.cliente_nombre}?`,
      confirmText: 'Eliminar',
    })) return
    if (await ejecutar(() => deleteItem(pc.id, item.id), 'Error al eliminar artículo')) recargar()
  }

  const subirImagenItem = async (pc, itemId, file) => {
    try { await uploadItemImagen(pc.id, itemId, file); toast.success('Imagen subida'); await recargar() }
    catch (err) { toast.error(errorMsg(err, 'Error al subir imagen')) }
  }

  const eliminarImagenItem = async (pc, itemId) => {
    if (!await confirm({ title: 'Quitar foto', message: '¿Quitar la foto de este artículo?', confirmText: 'Quitar' })) return
    try { await deleteItemImagen(pc.id, itemId); recargar() }
    catch (err) { toast.error(errorMsg(err, 'Error al eliminar imagen')) }
  }

  // ── Pagos ─────────────────────────────────────────
  const abrirPago = (pc) => { setFormPago(pagoVacio); setPanelPago(pc) }

  const cerrarPago = () => {
    if (formPago.preview) URL.revokeObjectURL(formPago.preview)
    setFormPago(pagoVacio)
    setPanelPago(null)
  }

  const registrarPago = async (e) => {
    e.preventDefault()
    const monto = parseFloat(formPago.monto)
    if (!(monto > 0)) return toast.error('Ingresa un monto mayor a 0')
    const pc = panelPago
    const ok = await ejecutar(async () => {
      const { data: pago } = await createPago(pc.id, { monto, tipo: formPago.tipo, notas: formPago.notas.trim() || null })
      if (formPago.file) {
        try { await uploadComprobante(pc.id, pago.id, formPago.file) }
        catch (err) { toast.error(errorMsg(err, 'Pago registrado, pero el comprobante no se pudo subir.')) }
      }
      await recargar()
    }, 'Error al registrar pago')
    if (ok) {
      cerrarPago()
      toast.success(`Pago de $${monto.toFixed(2)} registrado`)
    }
  }

  const eliminarPago = async (pc, pago) => {
    if (!await confirm({
      title: 'Eliminar pago',
      message: `¿Eliminar el pago de $${Number(pago.monto).toFixed(2)} de ${pc.cliente_nombre}?`,
      confirmText: 'Eliminar',
    })) return
    if (await ejecutar(() => deletePago(pc.id, pago.id), 'Error al eliminar pago')) recargar()
  }

  const subirComprobante = async (pc, pagoId, file) => {
    try { await uploadComprobante(pc.id, pagoId, file); toast.success('Comprobante subido'); await recargar() }
    catch (err) { toast.error(errorMsg(err, 'Error al subir comprobante')) }
  }

  const eliminarComprobante = async (pc, pagoId) => {
    if (!await confirm({ title: 'Quitar comprobante', message: '¿Quitar el comprobante de este pago?', confirmText: 'Quitar' })) return
    try { await deleteComprobante(pc.id, pagoId); recargar() }
    catch (err) { toast.error(errorMsg(err, 'Error al quitar comprobante')) }
  }

  // Mensaje para WhatsApp: solo articulos activos, igual que la factura
  const copiarMensaje = async (pc) => {
    const url = `${window.location.origin}/p/${pc.token_publico}`
    const itemsTexto = pc.items
      .filter((i) => i.activo)
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
    try {
      await navigator.clipboard.writeText(mensaje)
      toast.success('Mensaje copiado, listo para pegar en WhatsApp')
    } catch {
      toast.error('No se pudo copiar. Revisa los permisos del portapapeles del navegador.')
    }
  }

  if (loading) return <Cargando />
  if (!pedido) return (
    <div className="text-center py-16 space-y-3">
      <p className="text-ldg-muted text-sm">No se pudo cargar el pedido.</p>
      <div className="flex justify-center gap-2">
        <button onClick={() => { setLoading(true); cargar() }} className="ldg-btn-secondary">Reintentar</button>
        <Link to="/" className="ldg-btn-ghost">Volver a pedidos</Link>
      </div>
    </div>
  )

  const clientesEnPedido    = pedido.clientes.map((c) => c.cliente_id)
  const clientesDisponibles = clientes.filter((c) => !clientesEnPedido.includes(c.id))
  const qCombo = busquedaCombo.trim().toLowerCase()
  const opcionesCombo = clientesDisponibles.filter((c) =>
    c.nombre.toLowerCase().includes(qCombo) || c.aliases?.some((a) => a.alias.toLowerCase().includes(qCombo)),
  )
  const existeExacto = clientes.some((c) => c.nombre.toLowerCase() === qCombo)
  const puedeCrear = qCombo.length > 0 && !existeExacto

  const resumenPedido = pedido.clientes.reduce(
    (acc, pc) => ({
      porCobrar: acc.porCobrar + Math.max(0, Number(pc.saldo)),
      cobrado:   acc.cobrado   + Number(pc.total_pagado),
      comision:  acc.comision  + Number(pc.comision),
      totalItems: acc.totalItems + pc.items.length,
    }),
    { porCobrar: 0, cobrado: 0, comision: 0, totalItems: 0 }
  )

  const todosColapsados = pedido.clientes.length > 0 && pedido.clientes.every((pc) => colapsados.has(pc.id))

  const clientesFiltrados = pedido.clientes.filter((pc) => {
    const q = busquedaPedido.trim().toLowerCase()
    if (q && !pc.cliente_nombre.toLowerCase().includes(q)) return false
    if (filtroEstadoPedido === 'pendientes') return Number(pc.saldo) > 0
    if (filtroEstadoPedido === 'pagados')    return Number(pc.saldo) <= 0
    return true
  })

  const pcItemActual = panelItem ? (pedido.clientes.find((c) => c.id === panelItem.id) ?? panelItem) : null

  const onComboKey = (e) => {
    const total = opcionesCombo.length + (puedeCrear ? 1 : 0)
    if (e.key === 'ArrowDown') { e.preventDefault(); setComboIdx((i) => Math.min(i + 1, total - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setComboIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (comboIdx < opcionesCombo.length) agregarCliente(opcionesCombo[comboIdx])
      else if (puedeCrear) crearYAgregarCliente(busquedaCombo.trim())
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Ruta" className="text-xs text-ldg-muted mb-2">
        <Link to="/" className="hover:text-ldg-ink transition-colors">Pedidos</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="font-mono" aria-current="page">{numPedido(pedido)}</span>
      </nav>

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5 pb-4 border-b border-ldg-line">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold text-ldg-ink tracking-tight">
            <span className="font-mono">{numPedido(pedido)}</span>
            <span className="text-ldg-muted font-normal text-lg ml-3">{fechaLarga(pedido.fecha)}</span>
          </h1>
          {pedido.notas && <p className="text-sm text-ldg-ink-soft italic mt-1.5 break-words">{pedido.notas}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {pedido.clientes.length > 1 && (
            <button
              onClick={() => setColapsados(todosColapsados ? new Set() : new Set(pedido.clientes.map((pc) => pc.id)))}
              className="ldg-btn-ghost"
            >
              {todosColapsados ? 'Expandir todo' : 'Contraer todo'}
            </button>
          )}
          <button onClick={handleExport} disabled={exportando} className="ldg-btn-success">
            {exportando ? 'Exportando…' : 'Exportar Excel'}
          </button>
          <button onClick={() => setPanelCliente(true)} className="ldg-btn-primary">+ Cliente</button>
        </div>
      </div>

      {/* Stats strip */}
      {pedido.clientes.length > 0 && (
        <div className="bg-ldg-surface border border-ldg-line rounded flex mb-5 overflow-x-auto">
          <StatCell label="Clientes"   value={pedido.clientes.length} />
          <StatCell label="Items"      value={resumenPedido.totalItems} />
          <StatCell label="Comisión"   value={`$${resumenPedido.comision.toFixed(2)}`}  accent="text-ldg-accent" />
          <StatCell label="Cobrado"    value={`$${resumenPedido.cobrado.toFixed(2)}`}   accent="text-ldg-success" />
          <StatCell label="Por cobrar" value={`$${resumenPedido.porCobrar.toFixed(2)}`} accent={resumenPedido.porCobrar > 0 ? 'text-ldg-accent' : 'text-ldg-success'} last />
        </div>
      )}

      {/* Search/filter bar */}
      {pedido.clientes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="ldg-search flex-1 min-w-[200px] max-w-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ldg-muted flex-shrink-0" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={busquedaPedido}
              onChange={(e) => setBusquedaPedido(e.target.value)}
              placeholder="Buscar cliente…"
              aria-label="Buscar cliente en este pedido"
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent text-sm text-ldg-ink placeholder:text-ldg-muted-soft focus:outline-none"
            />
            {busquedaPedido && (
              <button onClick={() => setBusquedaPedido('')} aria-label="Limpiar búsqueda" className="text-ldg-muted hover:text-ldg-ink text-base leading-none">&times;</button>
            )}
          </div>
          <div className="flex border border-ldg-line rounded overflow-hidden font-mono text-xs" role="group" aria-label="Filtrar por estado de pago">
            {[
              { key: 'todos', label: 'todos' },
              { key: 'pendientes', label: 'con saldo' },
              { key: 'pagados', label: 'pagados' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltroEstadoPedido(key)}
                aria-pressed={filtroEstadoPedido === key}
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
        <div className="text-center py-16 border border-dashed border-ldg-line rounded space-y-3">
          <p className="text-ldg-muted text-sm">Este pedido aún no tiene clientes.</p>
          <button onClick={() => setPanelCliente(true)} className="ldg-btn-primary">+ Agregar el primer cliente</button>
        </div>
      )}
      {pedido.clientes.length > 0 && clientesFiltrados.length === 0 && (
        <p className="text-center py-10 text-ldg-muted text-sm">Ningún cliente coincide con el filtro.</p>
      )}

      {/* Client cards */}
      <div className="space-y-4">
        {clientesFiltrados.map((pc) => {
          const pagado = Number(pc.saldo) <= 0
          const pct = Number(pc.total) > 0 ? Math.min(100, (Number(pc.total_pagado) / Number(pc.total)) * 100) : 0
          const colapsado = colapsados.has(pc.id)
          const activos = pc.items.filter((i) => i.activo).length

          return (
            <section key={pc.id} aria-label={pc.cliente_nombre} className="bg-ldg-surface border border-ldg-line rounded">
              {/* Client header */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-ldg-surface-alt border-b border-ldg-line-soft rounded-t">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <span
                    aria-hidden="true"
                    className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-ldg-ink flex-shrink-0 ${avatarClass(pc.cliente_nombre)}`}
                  >
                    {initials(pc.cliente_nombre)}
                  </span>
                  <div className="min-w-0">
                    <Link to={`/clientes/${pc.cliente_id}`} className="text-sm font-bold text-ldg-ink hover:text-ldg-accent transition-colors break-words">
                      {pc.cliente_nombre}
                    </Link>
                    {editandoComision === pc.cliente_id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); guardarComision(pc.cliente_id) }}
                        className="flex items-center gap-1 mt-0.5"
                      >
                        <span className="text-xs text-ldg-muted font-mono">$</span>
                        <input
                          type="number" step="0.01" min="0" inputMode="decimal"
                          value={comisionInput}
                          onChange={(e) => setComisionInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditandoComision(null) } }}
                          aria-label={`Comisión por artículo de ${pc.cliente_nombre}`}
                          autoFocus
                          className="w-16 border border-ldg-accent rounded px-1 py-0.5 text-xs font-mono text-ldg-ink bg-ldg-bg focus:outline-none"
                        />
                        <span className="text-xs text-ldg-muted font-mono">/item</span>
                        <button type="submit" disabled={guardando} className="ldg-link text-xs text-ldg-accent font-semibold">Guardar</button>
                        <button type="button" onClick={() => setEditandoComision(null)} className="ldg-link text-xs">Cancelar</button>
                      </form>
                    ) : (
                      <p className="text-[11px] font-mono text-ldg-muted">
                        <button
                          onClick={() => { setEditandoComision(pc.cliente_id); setComisionInput(String(Number(pc.cliente_comision))) }}
                          title="Editar comisión de este pedido"
                          className="underline decoration-dotted underline-offset-2 hover:text-ldg-accent transition-colors"
                        >
                          comisión ${Number(pc.cliente_comision).toFixed(2)}/item
                        </button>
                        {' · '}{pc.items.length} items · {activos} activos
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-sm">
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

                <div className="flex items-center gap-1.5">
                  <Link to={`/factura/${pc.id}?pedido=${id}`} className="ldg-btn-ghost text-xs px-2.5 py-1">Factura</Link>
                  {pc.token_publico && (
                    <button onClick={() => copiarMensaje(pc)} className="ldg-btn-ghost text-xs px-2.5 py-1" title="Copia el resumen + enlace para WhatsApp">
                      Copiar mensaje
                    </button>
                  )}
                  <MenuAcciones
                    label={`Más acciones para ${pc.cliente_nombre}`}
                    abierto={menuAbierto === pc.id}
                    onToggle={() => setMenuAbierto(menuAbierto === pc.id ? null : pc.id)}
                    onClose={() => setMenuAbierto(null)}
                  >
                    <ItemMenu onClick={() => { setMenuAbierto(null); setPanelMover(pc); setPedidoDestinoId('') }}>
                      Mover cliente a otro pedido
                    </ItemMenu>
                    {pc.items.length > 0 && (
                      <ItemMenu onClick={() => { setMenuAbierto(null); abrirMoverItems(pc) }}>
                        Mover artículos…
                      </ItemMenu>
                    )}
                    <div className="my-1 border-t border-ldg-line-soft" role="separator" />
                    <ItemMenu danger onClick={() => { setMenuAbierto(null); quitarCliente(pc) }}>
                      Quitar del pedido
                    </ItemMenu>
                  </MenuAcciones>
                  <button
                    onClick={() => setColapsados((prev) => {
                      const next = new Set(prev)
                      next.has(pc.id) ? next.delete(pc.id) : next.add(pc.id)
                      return next
                    })}
                    aria-expanded={!colapsado}
                    aria-label={colapsado ? `Mostrar artículos de ${pc.cliente_nombre}` : `Ocultar artículos de ${pc.cliente_nombre}`}
                    className="ldg-icon-btn text-base leading-none"
                  >
                    <span aria-hidden="true">{colapsado ? '▸' : '▾'}</span>
                  </button>
                </div>
              </div>

              {!colapsado && (
                <>
                  {/* ponytail: tabla de ancho minimo con scroll horizontal en movil;
                      si se usa mucho en celular, pasar a layout de tarjeta por item */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[560px]">
                      <div
                        className="grid gap-3 px-4 py-2 text-[10px] font-semibold tracking-widest uppercase text-ldg-muted border-b border-ldg-line-soft"
                        style={{ gridTemplateColumns: ITEM_COL }}
                      >
                        <span>#</span><span>Foto</span><span>Artículo</span>
                        <span className="text-right">Precio</span>
                        <span className="text-center">Activo</span><span></span>
                      </div>

                      {pc.items.length === 0 && (
                        <div className="px-4 py-3 text-xs text-ldg-muted italic">Sin artículos aún.</div>
                      )}
                      {pc.items.map((item) => {
                        const nombre = item.articulo || `Item #${item.numero}`
                        return (
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
                              <p className={`text-sm truncate ${item.activo ? 'text-ldg-ink' : 'text-ldg-muted line-through'}`} title={nombre}>
                                {item.articulo || <span className="text-ldg-muted">Item #{item.numero}</span>}
                              </p>
                              {item.link && (
                                <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] text-ldg-accent hover:underline truncate block">
                                  <span aria-hidden="true">↗ </span>ver enlace
                                </a>
                              )}
                            </div>
                            <span className={`text-right font-mono font-semibold text-sm ${item.activo ? 'text-ldg-ink' : 'text-ldg-muted-soft line-through'}`}>${Number(item.precio).toFixed(2)}</span>
                            <span className="text-center">
                              <button
                                onClick={() => toggleActivo(pc, item)}
                                aria-pressed={item.activo}
                                aria-label={`${nombre}: ${item.activo ? 'activo' : 'inactivo'}`}
                                title={item.activo ? 'Activo (click para desactivar)' : 'Inactivo (click para activar)'}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-ldg-surface-alt"
                              >
                                <span
                                  aria-hidden="true"
                                  className={`w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[11px] font-bold transition-colors ${
                                    item.activo
                                      ? 'bg-ldg-success text-ldg-on-ink'
                                      : 'border-[1.5px] border-dashed border-ldg-muted-soft text-transparent'
                                  }`}
                                >
                                  {item.activo ? '✓' : '·'}
                                </span>
                              </button>
                            </span>
                            <div className="flex items-center justify-end gap-1 text-[11px]">
                              <button
                                onClick={() => {
                                  setPanelEditItem({ ...item, _pc: pc })
                                  setFormEditItem({ link: item.link || '', articulo: item.articulo || '', precio: String(item.precio || '') })
                                }}
                                className="ldg-link"
                              >
                                editar
                              </button>
                              <button onClick={() => eliminarItem(pc, item)} aria-label={`Eliminar ${nombre}`} className="ldg-icon-btn hover:text-ldg-danger">×</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Add item row */}
                  <div className="px-4 py-2 border-b border-ldg-line">
                    <button
                      onClick={() => abrirNuevoItem(pc)}
                      className="ldg-link text-xs font-semibold text-ldg-accent tracking-wide"
                    >
                      + AGREGAR ARTÍCULO
                    </button>
                  </div>

                  {/* Footer: pagos | totals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {/* Pagos */}
                    <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-ldg-line bg-ldg-surface-alt">
                      <div className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-2">
                        Pagos ({pc.pagos.length})
                      </div>
                      {pc.pagos.length === 0 ? (
                        <p className="text-xs text-ldg-muted-soft italic">Sin pagos registrados</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {pc.pagos.map((pago) => (
                            <li key={pago.id} className="flex items-center gap-2">
                              <ImageUpload
                                imageUrl={pago.comprobante_url}
                                onUpload={(file) => subirComprobante(pc, pago.id, file)}
                                onDelete={pago.comprobante_url ? () => eliminarComprobante(pc, pago.id) : undefined}
                                label="comprobante"
                              />
                              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-mono text-ldg-ink-soft truncate" title={pago.notas || undefined}>
                                  {fechaHora(pago.fecha)} · {pago.tipo}{pago.notas ? ` (${pago.notas})` : ''}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-ldg-success flex-shrink-0">+${Number(pago.monto).toFixed(2)}</span>
                              </div>
                              <button
                                onClick={() => eliminarPago(pc, pago)}
                                aria-label={`Eliminar pago de $${Number(pago.monto).toFixed(2)}`}
                                className="ldg-icon-btn hover:text-ldg-danger flex-shrink-0"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={() => abrirPago(pc)}
                        className="ldg-link mt-2 text-[11px] font-semibold text-ldg-accent tracking-wide"
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
                        <div
                          className="h-1 bg-ldg-line-soft rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={Math.round(pct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Porcentaje pagado"
                        >
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
            </section>
          )
        })}
      </div>

      {/* Panel: agregar cliente (busca o crea en el mismo paso) */}
      <SidePanel open={panelCliente} onClose={cerrarPanelCliente} title="Agregar cliente al pedido">
        <div>
          <label htmlFor="combo-cliente" className="ldg-label">Cliente</label>
          <input
            id="combo-cliente"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="combo-opciones"
            aria-activedescendant={`combo-op-${comboIdx}`}
            autoComplete="off"
            placeholder="Escribe un nombre o alias…"
            value={busquedaCombo}
            onChange={(e) => { setBusquedaCombo(e.target.value); setComboIdx(0) }}
            onKeyDown={onComboKey}
            className="ldg-input"
          />
          <p className="text-[11px] text-ldg-muted mt-1">↑↓ para elegir, Enter para agregar.</p>
        </div>
        <ul id="combo-opciones" role="listbox" aria-label="Clientes disponibles" className="border border-ldg-line rounded max-h-[60vh] overflow-y-auto divide-y divide-ldg-line-soft">
          {opcionesCombo.map((c, i) => (
            <li
              key={c.id}
              id={`combo-op-${i}`}
              role="option"
              aria-selected={comboIdx === i}
              onMouseEnter={() => setComboIdx(i)}
              onClick={() => agregarCliente(c)}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer ${comboIdx === i ? 'bg-ldg-surface-alt' : ''}`}
            >
              <span aria-hidden="true" className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold text-ldg-ink flex-shrink-0 ${avatarClass(c.nombre)}`}>
                {initials(c.nombre)}
              </span>
              <span className="flex-1 min-w-0 truncate text-ldg-ink">{c.nombre}</span>
              <span className="font-mono text-[11px] text-ldg-muted">${Number(c.comision_por_item).toFixed(2)}</span>
            </li>
          ))}
          {puedeCrear && (
            <li
              id={`combo-op-${opcionesCombo.length}`}
              role="option"
              aria-selected={comboIdx === opcionesCombo.length}
              onMouseEnter={() => setComboIdx(opcionesCombo.length)}
              onClick={() => crearYAgregarCliente(busquedaCombo.trim())}
              className={`px-3 py-2.5 text-sm cursor-pointer text-ldg-accent font-semibold ${comboIdx === opcionesCombo.length ? 'bg-ldg-surface-alt' : ''}`}
            >
              + Crear cliente «{busquedaCombo.trim()}» y agregarlo
            </li>
          )}
          {opcionesCombo.length === 0 && !puedeCrear && (
            <li className="px-3 py-2.5 text-sm text-ldg-muted">
              {clientesDisponibles.length === 0 ? 'Todos los clientes ya están en este pedido.' : 'Escribe para buscar.'}
            </li>
          )}
        </ul>
        {guardando && <p className="text-xs text-ldg-muted" role="status">Guardando…</p>}
      </SidePanel>

      {/* Panel: agregar articulo (foto incluida; queda abierto para el siguiente) */}
      <SidePanel
        open={!!panelItem}
        onClose={cerrarNuevoItem}
        title={pcItemActual ? `Nuevo artículo — ${pcItemActual.cliente_nombre}` : ''}
      >
        {pcItemActual && (
          <form onSubmit={agregarItem} className="space-y-4">
            <div>
              <span className="ldg-label">Foto</span>
              <ImageUpload
                imageUrl={formItem.preview}
                onUpload={elegirFotoNueva}
                onDelete={quitarFotoNueva}
                pegarGlobal
                size="w-full h-32"
                label="foto del artículo"
                texto="Pega con Ctrl+V, arrastra o toca para elegir"
              />
            </div>
            <div>
              <label htmlFor="item-link" className="ldg-label">Link del artículo</label>
              <input
                id="item-link" ref={primerCampoItem} data-autofocus
                type="text" inputMode="url" autoComplete="off" spellCheck={false}
                placeholder="https://…"
                value={formItem.link}
                onChange={(e) => setFormItem({ ...formItem, link: e.target.value })}
                className="ldg-input"
              />
            </div>
            <div>
              <label htmlFor="item-nombre" className="ldg-label">Nombre del artículo</label>
              <input id="item-nombre" type="text" autoComplete="off" placeholder="Opcional" value={formItem.articulo} onChange={(e) => setFormItem({ ...formItem, articulo: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <label htmlFor="item-precio" className="ldg-label">Precio <span className="text-ldg-danger">*</span></label>
              <input id="item-precio" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={formItem.precio} onChange={(e) => setFormItem({ ...formItem, precio: e.target.value })} required className="ldg-input font-mono" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={guardando} className="ldg-btn-primary flex-1 py-2">
                {guardando ? 'Guardando…' : 'Agregar artículo'}
              </button>
              <button type="button" onClick={cerrarNuevoItem} className="ldg-btn-ghost py-2">Listo</button>
            </div>
            <p className="text-[11px] text-ldg-muted" aria-live="polite">
              {agregadosPanel > 0
                ? `${agregadosPanel} agregado(s). El panel sigue abierto para el siguiente; Esc o "Listo" para cerrar.`
                : 'El panel queda abierto para cargar varios artículos seguidos.'}
            </p>
          </form>
        )}
      </SidePanel>

      {/* Panel: registrar pago (comprobante incluido) */}
      <SidePanel
        open={!!panelPago}
        onClose={cerrarPago}
        title={panelPago ? `Registrar pago — ${panelPago.cliente_nombre}` : ''}
      >
        {panelPago && (
          <form onSubmit={registrarPago} className="space-y-4">
            <div>
              <label htmlFor="pago-monto" className="ldg-label">Monto <span className="text-ldg-danger">*</span></label>
              <input id="pago-monto" type="number" step="0.01" min="0.01" inputMode="decimal" placeholder="0.00" value={formPago.monto} onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })} required className="ldg-input font-mono" />
              {Number(panelPago.saldo) > 0 && (
                <button
                  type="button"
                  onClick={() => setFormPago({ ...formPago, monto: Number(panelPago.saldo).toFixed(2) })}
                  className="ldg-link mt-1 text-[11px] text-ldg-accent"
                >
                  Usar saldo completo (${Number(panelPago.saldo).toFixed(2)})
                </button>
              )}
            </div>
            <div>
              <label htmlFor="pago-tipo" className="ldg-label">Tipo</label>
              <select id="pago-tipo" value={formPago.tipo} onChange={(e) => setFormPago({ ...formPago, tipo: e.target.value })} className="ldg-select w-full">
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="pago-notas" className="ldg-label">Notas</label>
              <input id="pago-notas" type="text" autoComplete="off" placeholder="Opcional" value={formPago.notas} onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <span className="ldg-label">Comprobante</span>
              <ImageUpload
                imageUrl={formPago.preview}
                onUpload={(file) => {
                  if (formPago.preview) URL.revokeObjectURL(formPago.preview)
                  setFormPago((f) => ({ ...f, file, preview: URL.createObjectURL(file) }))
                }}
                onDelete={() => {
                  if (formPago.preview) URL.revokeObjectURL(formPago.preview)
                  setFormPago((f) => ({ ...f, file: null, preview: null }))
                }}
                pegarGlobal
                size="w-full h-28"
                label="comprobante"
                texto="Opcional: pega, arrastra o toca para elegir"
              />
            </div>
            <button type="submit" disabled={guardando} className="ldg-btn-primary w-full py-2">
              {guardando ? 'Guardando…' : 'Registrar pago'}
            </button>
          </form>
        )}
      </SidePanel>

      {/* Panel: editar articulo */}
      <SidePanel
        open={!!panelEditItem}
        onClose={() => setPanelEditItem(null)}
        title={panelEditItem ? `Editar artículo — ${panelEditItem._pc?.cliente_nombre ?? ''}` : ''}
      >
        {panelEditItem && (
          <form onSubmit={guardarEditItem} className="space-y-4">
            <div>
              <label htmlFor="edit-link" className="ldg-label">Link del artículo</label>
              <input id="edit-link" type="text" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://…" value={formEditItem.link} onChange={(e) => setFormEditItem({ ...formEditItem, link: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <label htmlFor="edit-nombre" className="ldg-label">Nombre del artículo</label>
              <input id="edit-nombre" type="text" autoComplete="off" placeholder="Opcional" value={formEditItem.articulo} onChange={(e) => setFormEditItem({ ...formEditItem, articulo: e.target.value })} className="ldg-input" />
            </div>
            <div>
              <label htmlFor="edit-precio" className="ldg-label">Precio <span className="text-ldg-danger">*</span></label>
              <input id="edit-precio" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={formEditItem.precio} onChange={(e) => setFormEditItem({ ...formEditItem, precio: e.target.value })} required className="ldg-input font-mono" />
            </div>
            <button type="submit" disabled={guardando} className="ldg-btn-primary w-full py-2">
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
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
              <label htmlFor="mover-destino" className="ldg-label">Pedido destino</label>
              <select
                id="mover-destino"
                value={pedidoDestinoId}
                onChange={(e) => setPedidoDestinoId(e.target.value)}
                className="ldg-select w-full"
              >
                <option value="">Seleccionar pedido…</option>
                {pedidos
                  .filter((p) => p.id !== parseInt(id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>{numPedido(p)} — {fechaCorta(p.fecha)}</option>
                  ))}
              </select>
            </div>
            {panelMover.pagos.length > 0 && (
              <p className="text-[11px] text-ldg-accent font-mono">
                Este cliente tiene {panelMover.pagos.length} pago(s) registrado(s) que también se moverán.
              </p>
            )}
            <button
              onClick={moverCliente}
              disabled={!pedidoDestinoId || guardando}
              className="ldg-btn-primary w-full py-2"
            >
              {guardando ? 'Moviendo…' : 'Mover cliente'}
            </button>
          </div>
        )}
      </SidePanel>

      {/* Panel: mover articulos sueltos a otro cliente/pedido */}
      <SidePanel
        open={!!panelMoverItems}
        onClose={() => setPanelMoverItems(null)}
        title={panelMoverItems ? `Mover artículos — ${panelMoverItems.cliente_nombre}` : ''}
      >
        {panelMoverItems && (
          <div className="space-y-4">
            <p className="text-xs text-ldg-muted leading-relaxed">
              Selecciona los artículos y el cliente destino. Se trasladan tal cual (precio, imagen y estado activo se conservan); los pagos no se mueven.
            </p>

            <fieldset>
              <div className="flex items-center justify-between mb-1.5">
                <legend className="text-xs font-semibold tracking-widest uppercase text-ldg-muted">
                  Artículos ({itemsSeleccionados.size}/{panelMoverItems.items.length})
                </legend>
                <button
                  type="button"
                  onClick={() => setItemsSeleccionados(
                    itemsSeleccionados.size === panelMoverItems.items.length
                      ? new Set()
                      : new Set(panelMoverItems.items.map((i) => i.id))
                  )}
                  className="ldg-link text-[11px] text-ldg-accent"
                >
                  {itemsSeleccionados.size === panelMoverItems.items.length ? 'Ninguno' : 'Todos'}
                </button>
              </div>
              <div className="border border-ldg-line rounded divide-y divide-ldg-line-soft max-h-60 overflow-y-auto overscroll-contain">
                {panelMoverItems.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-ldg-surface-alt">
                    <input
                      type="checkbox"
                      checked={itemsSeleccionados.has(item.id)}
                      onChange={() => toggleSeleccionItem(item.id)}
                      className="accent-ldg-accent"
                    />
                    <span className="font-mono text-[11px] text-ldg-muted">{String(item.numero).padStart(2, '0')}</span>
                    <span className={`flex-1 min-w-0 text-sm truncate ${item.activo ? 'text-ldg-ink' : 'text-ldg-muted line-through'}`}>
                      {item.articulo || `Item #${item.numero}`}
                    </span>
                    <span className="font-mono text-xs text-ldg-ink-soft">${Number(item.precio).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="mover-items-pedido" className="ldg-label">Pedido destino</label>
              <select id="mover-items-pedido" value={moverDestPedidoId} onChange={(e) => cambiarPedidoDestino(e.target.value)} className="ldg-select w-full">
                {pedidos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {numPedido(p)} — {fechaCorta(p.fecha)}{p.id === parseInt(id) ? ' (este pedido)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mover-items-cliente" className="ldg-label">Cliente destino</label>
              <select id="mover-items-cliente" value={moverDestPcId} onChange={(e) => setMoverDestPcId(e.target.value)} className="ldg-select w-full">
                <option value="">Seleccionar cliente…</option>
                {(moverDestPedido?.clientes || [])
                  .filter((c) => c.id !== panelMoverItems.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.cliente_nombre}</option>
                  ))}
              </select>
              {(moverDestPedido?.clientes || []).filter((c) => c.id !== panelMoverItems.id).length === 0 && (
                <p className="text-[11px] text-ldg-muted mt-1">No hay otro cliente en este pedido. Elige otro pedido o agrega un cliente primero.</p>
              )}
            </div>

            <div>
              <label htmlFor="mover-confirmar" className="ldg-label">
                Escribe <span className="font-mono text-ldg-danger">MOVER</span> para confirmar
              </label>
              <input
                id="mover-confirmar"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={confirmMover}
                onChange={(e) => setConfirmMover(e.target.value)}
                placeholder="MOVER"
                className="ldg-input font-mono"
              />
            </div>

            <button
              onClick={ejecutarMoverItems}
              disabled={guardando || itemsSeleccionados.size === 0 || !moverDestPcId || confirmMover.trim().toUpperCase() !== 'MOVER'}
              className="ldg-btn-primary w-full py-2"
            >
              {guardando ? 'Moviendo…' : `Mover ${itemsSeleccionados.size || ''} artículo(s)`}
            </button>
          </div>
        )}
      </SidePanel>
    </div>
  )
}
