import { Navigate, Route, Routes } from 'react-router-dom'
import { PrivacyProvider } from './context/PrivacyContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Factura from './pages/Factura'
import FacturaPublica from './pages/FacturaPublica'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import Login from './pages/Login'
import NuevoPedido from './pages/NuevoPedido'
import PedidoDetalle from './pages/PedidoDetalle'

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <PrivacyProvider>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pedidos/nuevo" element={<NuevoPedido />} />
        <Route path="pedidos/:id" element={<PedidoDetalle />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ClienteDetalle />} />
      </Route>

      <Route
        path="/factura/:pcId"
        element={
          <PrivateRoute>
            <Factura />
          </PrivateRoute>
        }
      />

      {/* Ruta publica — sin login */}
      <Route path="/p/:token" element={<FacturaPublica />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </PrivacyProvider>
  )
}
