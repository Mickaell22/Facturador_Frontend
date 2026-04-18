import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useDarkMode from '../hooks/useDarkMode'
import { usePrivacy } from '../context/PrivacyContext'

export default function Layout() {
  const [dark, setDark] = useDarkMode()
  const { privado, revelar } = usePrivacy()
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg text-blue-600">Facturador Temu</span>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1">
              <NavLink to="/" end className={linkClass}>Pedidos</NavLink>
              <NavLink to="/clientes" className={linkClass}>Clientes</NavLink>
            </nav>
            <button
              onClick={revelar}
              className={`ml-2 p-1.5 rounded-lg transition-colors text-sm ${
                privado
                  ? 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
              }`}
              title={privado ? 'Mostrar cifras (7 seg)' : 'Ocultar cifras'}
            >
              {privado ? 'Mostrar' : 'Ocultar'}
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              title={dark ? 'Modo claro' : 'Modo oscuro'}
            >
              {dark ? 'Claro' : 'Oscuro'}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              title="Cerrar sesion"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
