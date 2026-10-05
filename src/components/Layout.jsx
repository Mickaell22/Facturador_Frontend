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
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 ldg-btn-primary">
        Saltar al contenido
      </a>
      <header className="border-b border-ldg-line bg-ldg-bg sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-3">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-[22px] h-[22px] rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-xs font-extrabold font-mono flex-shrink-0">
              F
            </div>
            <span className="hidden sm:inline text-sm font-bold tracking-widest">FACTURADOR</span>
          </div>
          <nav aria-label="Principal" className="flex gap-0.5 sm:ml-4">
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
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-ldg-muted font-mono flex-shrink-0">
          <button
            onClick={() => setDark(!dark)}
            className="ldg-link"
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span aria-hidden="true">{dark ? '◑' : '◐'}</span>
            <span className="hidden sm:inline ml-1">{dark ? 'Claro' : 'Oscuro'}</span>
          </button>
          <span className="w-px h-3.5 bg-ldg-line" aria-hidden="true" />
          <button
            onClick={handleLogout}
            className="ldg-link"
          >
            Salir
          </button>
        </div>
      </header>

      <main id="contenido" className="flex-1 px-4 sm:px-8 py-5 sm:py-6 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
