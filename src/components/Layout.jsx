import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg text-blue-600">Facturador Temu</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={linkClass}>Pedidos</NavLink>
            <NavLink to="/clientes" className={linkClass}>Clientes</NavLink>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
