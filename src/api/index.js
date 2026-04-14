import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

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

// ── Items ─────────────────────────────────────────────
export const getItems = (pcId) => api.get(`/pedido-clientes/${pcId}/items`)
export const createItem = (pcId, data) => api.post(`/pedido-clientes/${pcId}/items`, data)
export const updateItem = (pcId, itemId, data) => api.put(`/pedido-clientes/${pcId}/items/${itemId}`, data)
export const deleteItem = (pcId, itemId) => api.delete(`/pedido-clientes/${pcId}/items/${itemId}`)
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
