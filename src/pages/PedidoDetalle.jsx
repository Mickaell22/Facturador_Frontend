import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SidePanel from '../components/SidePanel'
import ImageUpload from '../components/ImageUpload'
import {
  getPedido, getClientes, addClienteToPedido, removeClienteFromPedido,
  createItem, updateItem, deleteItem, uploadItemImagen,
  createPago, deletePago, uploadComprobante,
} from '../api'

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500'
const selectCls = 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

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
  const [formItem, setFormItem] = useState({ link: '', articulo: '', precio: '' })
  const [formPago, setFormPago] = useState({ monto: '', tipo: 'transferencia', notas: '' })

  const cargar = async () => {
    try {
      const [pedidoRes, clientesRes] = await Promise.all([getPedido(id), getClientes()])
      setPedido(pedidoRes.data)
      setClientes(clientesRes.data)
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
    if (!confirm('Quitar cliente del pedido? Se eliminaran sus items y pagos.')) return
    try { await removeClienteFromPedido(id, clienteId); cargar() }
    catch { toast.error('Error al quitar cliente') }
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
    if (!confirm('Eliminar item?')) return
    try { await deleteItem(pc.id, itemId); cargar() }
    catch { toast.error('Error al eliminar item') }
  }

  const subirImagenItem = async (pc, itemId, file) => {
    try { await uploadItemImagen(pc.id, itemId, file); toast.success('Imagen subida'); cargar() }
    catch { toast.error('Error al subir imagen') }
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
    if (!confirm('Eliminar pago?')) return
    try { await deletePago(pc.id, pagoId); cargar() }
    catch { toast.error('Error al eliminar pago') }
  }

  const subirComprobante = async (pc, pagoId, file) => {
    try { await uploadComprobante(pc.id, pagoId, file); toast.success('Comprobante subido'); cargar() }
    catch { toast.error('Error al subir comprobante') }
  }

  if (loading) return <p className="text-center py-10 text-gray-400">Cargando...</p>
  if (!pedido) return <p className="text-center py-10 text-gray-400">Pedido no encontrado</p>

  const clientesEnPedido = pedido.clientes.map((c) => c.cliente_id)
  const clientesDisponibles = clientes.filter((c) => !clientesEnPedido.includes(c.id))
  const fechaFormateada = new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm">
            Volver
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Pedido #{pedido.numero ?? pedido.id} — {fechaFormateada}
          </h1>
        </div>
        <button onClick={() => setPanelCliente(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Agregar cliente
        </button>
      </div>

      {pedido.clientes.length === 0 ? (
        <p className="text-center py-20 text-gray-400">Agrega un cliente para comenzar.</p>
      ) : (
        <div className="space-y-5">
          {pedido.clientes.map((pc) => (
            <div key={pc.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {/* Header cliente */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{pc.cliente_nombre}</span>
                  <span className="ml-2 text-xs text-gray-400">comision ${Number(pc.cliente_comision).toFixed(2)}/item</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { sessionStorage.setItem('pedido_id_para_factura', id); navigate(`/factura/${pc.id}`) }}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Ver factura
                  </button>
                  {pc.token_publico && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/p/${pc.token_publico}`
                        navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado'))
                      }}
                      className="text-sm text-gray-400 dark:text-gray-500 hover:underline"
                    >
                      Copiar enlace
                    </button>
                  )}
                  <button onClick={() => quitarCliente(pc.cliente_id)} className="text-sm text-red-400 hover:underline">Quitar</button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Articulos</span>
                    <button
                      onClick={() => { setFormItem({ link: '', articulo: '', precio: '' }); setPanelItem(pc) }}
                      className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg"
                    >
                      + Agregar
                    </button>
                  </div>

                  {pc.items.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin articulos aun.</p>
                  ) : (
                    <div className="space-y-2">
                      {pc.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-1">
                          <ImageUpload imageUrl={item.imagen_url} onUpload={(file) => subirImagenItem(pc, item.id, file)} />
                          <div className="flex-1 min-w-0">
                            {item.articulo && <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{item.articulo}</p>}
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                                ver en Temu
                              </a>
                            )}
                            {!item.articulo && !item.link && <span className="text-xs text-gray-400">Item #{item.numero}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">${Number(item.precio).toFixed(2)}</span>
                            <button
                              onClick={() => toggleLlegado(pc, item)}
                              title={item.llegado ? 'Llego' : 'Marcar como llegado'}
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                item.llegado
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-300 dark:text-gray-600 hover:border-green-400'
                              }`}
                            >
                              {item.llegado ? '1' : ''}
                            </button>
                            <button onClick={() => eliminarItem(pc, item.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-sm w-5 h-5 flex items-center justify-center">
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totales */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Subtotal ({pc.items.filter((i) => i.llegado).length} llegados)</span>
                    <span>${Number(pc.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Comision</span>
                    <span>${Number(pc.comision).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-100">
                    <span>Total</span>
                    <span>${Number(pc.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Pagado</span>
                    <span className="text-green-500">-${Number(pc.total_pagado).toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-base pt-1 border-t border-gray-100 dark:border-gray-700 ${Number(pc.saldo) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    <span>Saldo pendiente</span>
                    <span>${Number(pc.saldo).toFixed(2)}</span>
                  </div>
                </div>

                {/* Pagos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagos</span>
                    <button
                      onClick={() => { setFormPago({ monto: '', tipo: 'transferencia', notas: '' }); setPanelPago(pc) }}
                      className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg"
                    >
                      + Registrar pago
                    </button>
                  </div>

                  {pc.pagos.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin pagos registrados.</p>
                  ) : (
                    <div className="space-y-2">
                      {pc.pagos.map((pago) => (
                        <div key={pago.id} className="flex items-center gap-3 py-1">
                          <ImageUpload imageUrl={pago.comprobante_url} onUpload={(file) => subirComprobante(pc, pago.id, file)} label="comp." />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-green-500">${Number(pago.monto).toFixed(2)}</span>
                              <span className="text-xs text-gray-400 capitalize">{pago.tipo}</span>
                            </div>
                            {pago.notas && <p className="text-xs text-gray-400">{pago.notas}</p>}
                            <p className="text-xs text-gray-400">
                              {new Date(pago.fecha).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <button onClick={() => eliminarPago(pc, pago.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-sm w-5 h-5 flex items-center justify-center flex-shrink-0">
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel: agregar cliente */}
      <SidePanel open={panelCliente} onClose={() => setPanelCliente(false)} title="Agregar cliente al pedido">
        <div className="space-y-4">
          {clientesDisponibles.length === 0 ? (
            <p className="text-sm text-gray-400">Todos los clientes ya estan en este pedido.</p>
          ) : (
            <>
              <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} className={selectCls + ' w-full'}>
                <option value="">Seleccionar cliente...</option>
                {clientesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <button onClick={agregarCliente} disabled={!clienteSeleccionado} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                Agregar
              </button>
            </>
          )}
        </div>
      </SidePanel>

      {/* Panel: agregar item */}
      <SidePanel open={!!panelItem} onClose={() => setPanelItem(null)} title={panelItem ? `Nuevo articulo — ${panelItem.cliente_nombre}` : ''}>
        {panelItem && (
          <form onSubmit={(e) => agregarItem(e, panelItem)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link de Temu</label>
              <input type="text" placeholder="https://share.temu.com/..." value={formItem.link} onChange={(e) => setFormItem({ ...formItem, link: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del articulo</label>
              <input type="text" placeholder="Opcional" value={formItem.articulo} onChange={(e) => setFormItem({ ...formItem, articulo: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={formItem.precio} onChange={(e) => setFormItem({ ...formItem, precio: e.target.value })} required className={inputCls} />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Agregar articulo
            </button>
          </form>
        )}
      </SidePanel>

      {/* Panel: registrar pago */}
      <SidePanel open={!!panelPago} onClose={() => setPanelPago(null)} title={panelPago ? `Registrar pago — ${panelPago.cliente_nombre}` : ''}>
        {panelPago && (
          <form onSubmit={(e) => registrarPago(e, panelPago)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={formPago.monto} onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select value={formPago.tipo} onChange={(e) => setFormPago({ ...formPago, tipo: e.target.value })} className={selectCls + ' w-full'}>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
              <input type="text" placeholder="Opcional" value={formPago.notas} onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })} className={inputCls} />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Registrar pago
            </button>
          </form>
        )}
      </SidePanel>
    </div>
  )
}
