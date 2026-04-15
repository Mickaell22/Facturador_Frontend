import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SidePanel from '../components/SidePanel'
import { getClientes, createCliente, updateCliente, deleteCliente, addAlias, deleteAlias } from '../api'

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500'

const formVacio = { nombre: '', comision_por_item: '0.50' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formVacio)
  const [nuevoAlias, setNuevoAlias] = useState({})
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

  const abrirNuevo = () => { setEditando(null); setForm(formVacio); setPanelAbierto(true) }
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
    if (!confirm('Eliminar cliente? Solo es posible si no tiene pedidos asociados.')) return
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

  if (loading) return <p className="text-center py-10 text-gray-400">Cargando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Clientes</h1>
        <button onClick={abrirNuevo} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nuevo cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <p className="text-center py-20 text-gray-400">No hay clientes aun.</p>
      ) : (
        <div className="space-y-4">
          {clientes.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{c.nombre}</p>
                  <p className="text-sm text-gray-400 mt-0.5">Comision: ${Number(c.comision_por_item).toFixed(2)}/item</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate(`/clientes/${c.id}`)} className="text-sm text-blue-500 hover:underline">Ver historial</button>
                  <button onClick={() => abrirEditar(c)} className="text-sm text-gray-400 hover:underline dark:text-gray-500">Editar</button>
                  <button onClick={() => handleEliminar(c.id)} className="text-sm text-red-400 hover:underline">Eliminar</button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Aliases:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {c.aliases.length === 0 && <span className="text-xs text-gray-300 dark:text-gray-600">Sin aliases</span>}
                  {c.aliases.map((a) => (
                    <span key={a.id} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                      {a.alias}
                      <button onClick={() => handleEliminarAlias(c.id, a.id)} className="text-gray-400 hover:text-red-400 ml-0.5">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Agregar alias..."
                    value={nuevoAlias[c.id] || ''}
                    onChange={(e) => setNuevoAlias({ ...nuevoAlias, [c.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarAlias(c.id))}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={() => handleAgregarAlias(c.id)} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700">
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SidePanel open={panelAbierto} onClose={cerrarPanel} title={editando ? `Editar — ${editando.nombre}` : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Nombre del cliente" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comision por item ($)</label>
            <input type="number" step="0.01" min="0" value={form.comision_por_item} onChange={(e) => setForm({ ...form, comision_por_item: e.target.value })} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Usa 0 si no cobras comision.</p>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            {editando ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </form>
      </SidePanel>
    </div>
  )
}
