import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NuevoPedido from './pages/NuevoPedido'
import PedidoDetalle from './pages/PedidoDetalle'
import Clientes from './pages/Clientes'
import Factura from './pages/Factura'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pedidos/nuevo" element={<NuevoPedido />} />
        <Route path="pedidos/:id" element={<PedidoDetalle />} />
        <Route path="clientes" element={<Clientes />} />
      </Route>
      <Route path="/factura/:pcId" element={<Factura />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
