import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useDarkMode from '../hooks/useDarkMode'

export default function Layout() {
  const [dark, setDark] = useDarkMode()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-ldg-bg text-ldg-ink">
      <header className="border-b border-ldg-line bg-ldg-bg sticky top-0 z-10 flex items-center justify-between px-8 py-3.5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-[22px] h-[22px] rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-xs font-extrabold font-mono flex-shrink-0">
              F
            </div>
            <span className="text-sm font-bold tracking-widest">FACTURADOR</span>
          </div>
          <nav className="flex gap-0.5 ml-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-2.5 py-1.5 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
                  isActive
                    ? 'text-ldg-ink border-ldg-accent'
                    : 'text-ldg-muted border-transparent hover:text-ldg-ink'
                }`
              }
            >
              Pedidos
            </NavLink>
            <NavLink
              to="/clientes"
              className={({ isActive }) =>
                `px-2.5 py-1.5 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
                  isActive
                    ? 'text-ldg-ink border-ldg-accent'
                    : 'text-ldg-muted border-transparent hover:text-ldg-ink'
                }`
              }
            >
              Clientes
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-ldg-muted font-mono">
          <button
            onClick={() => setDark(!dark)}
            className="text-ldg-muted hover:text-ldg-ink transition-colors"
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? '◑ Claro' : '◐ Oscuro'}
          </button>
          <span className="w-px h-3.5 bg-ldg-line" />
          <button
            onClick={handleLogout}
            className="text-ldg-muted hover:text-ldg-ink transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 px-8 py-6">
        <Outlet />
      </main>
    </div>
  )
}
