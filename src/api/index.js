import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Agrega el token JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expira o es invalido, redirige al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Clientes ──────────────────────────────────────────
export const getClientes = () => api.get('/clientes')
export const getCliente = (id) => api.get(`/clientes/${id}`)
export const createCliente = (data) => api.post('/clientes', data)
export const updateCliente = (id, data) => api.put(`/clientes/${id}`, data)
export const deleteCliente = (id) => api.delete(`/clientes/${id}`)
export const addAlias = (id, alias) => api.post(`/clientes/${id}/aliases`, { alias })
export const deleteAlias = (clienteId, aliasId) => api.delete(`/clientes/${clienteId}/aliases/${aliasId}`)

// ── Pedidos ───────────────────────────────────────────
export const getPedidos = () => api.get('/pedidos')
export const getPedido = (id) => api.get(`/pedidos/${id}`)
export const createPedido = (data) => api.post('/pedidos', data)
export const updatePedido = (id, data) => api.put(`/pedidos/${id}`, data)
export const deletePedido = (id) => api.delete(`/pedidos/${id}`)
export const addClienteToPedido = (pedidoId, clienteId) =>
  api.post(`/pedidos/${pedidoId}/clientes/${clienteId}`)
export const removeClienteFromPedido = (pedidoId, clienteId) =>
  api.delete(`/pedidos/${pedidoId}/clientes/${clienteId}`)
export const updateComisionPedidoCliente = (pedidoId, clienteId, comision) =>
  api.patch(`/pedidos/${pedidoId}/clientes/${clienteId}/comision`, { comision_por_item: comision })
export const moverClientePedido = (pedidoId, clienteId, destinoPedidoId) =>
  api.post(`/pedidos/${pedidoId}/clientes/${clienteId}/mover`, { destino_pedido_id: destinoPedidoId })

// ── Items ─────────────────────────────────────────────
export const getItems = (pcId) => api.get(`/pedido-clientes/${pcId}/items`)
export const createItem = (pcId, data) => api.post(`/pedido-clientes/${pcId}/items`, data)
export const updateItem = (pcId, itemId, data) => api.put(`/pedido-clientes/${pcId}/items/${itemId}`, data)
export const deleteItem = (pcId, itemId) => api.delete(`/pedido-clientes/${pcId}/items/${itemId}`)
export const deleteItemImagen = (pcId, itemId) =>
  api.delete(`/pedido-clientes/${pcId}/items/${itemId}/imagen`)

export const uploadItemImagen = (pcId, itemId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/pedido-clientes/${pcId}/items/${itemId}/imagen`, form)
}

// ── Pagos ─────────────────────────────────────────────
export const getPagos = (pcId) => api.get(`/pedido-clientes/${pcId}/pagos`)
export const createPago = (pcId, data) => api.post(`/pedido-clientes/${pcId}/pagos`, data)
export const deletePago = (pcId, pagoId) => api.delete(`/pedido-clientes/${pcId}/pagos/${pagoId}`)
export const uploadComprobante = (pcId, pagoId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/pedido-clientes/${pcId}/pagos/${pagoId}/comprobante`, form)
}

// ── Export ────────────────────────────────────────────
export const exportPedidoExcel = (id) =>
  api.get(`/pedidos/${id}/export`, { responseType: 'blob' })

// ── Stats ─────────────────────────────────────────────
export const getDashboardStats = () => api.get('/stats/dashboard')
export const getHistorialCliente = (id) => api.get(`/stats/clientes/${id}`)

// ── Publico (sin auth) ────────────────────────────────
export const getFacturaPublica = (token) => api.get(`/public/factura/${token}`)
export const getHistorialClientePublico = (token) => api.get(`/public/cliente/${token}`)
