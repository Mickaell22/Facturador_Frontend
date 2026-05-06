import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ERROR_MESSAGES = {
  cancelado: 'Inicio de sesion cancelado.',
  no_autorizado: 'Esta cuenta de Google no tiene acceso permitido.',
  oauth_failed: 'Error al conectar con Google. Intenta de nuevo.',
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const error = params.get('error')

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else if (theme === 'light') document.documentElement.classList.remove('dark')
    if (localStorage.getItem('token')) navigate('/', { replace: true })
  }, [])

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ldg-bg px-4 font-sans">
      <div className="w-full max-w-[420px] bg-ldg-surface border border-ldg-line rounded overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-ldg-line bg-ldg-surface-alt">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded bg-ldg-ink text-ldg-on-ink flex items-center justify-center text-base font-extrabold font-mono">
              F
            </div>
            <span className="text-base font-bold tracking-widest text-ldg-ink">FACTURADOR</span>
          </div>
          <h1 className="text-[22px] font-bold text-ldg-ink tracking-tight mb-1.5">Iniciar sesión</h1>
          <p className="text-sm text-ldg-muted">Accede a tus pedidos y clientes.</p>
        </div>

        <div className="px-8 py-6">
          {error && (
            <div className="text-sm text-ldg-danger bg-ldg-accent-soft border border-ldg-accent/30 rounded px-3 py-2 mb-5">
              {ERROR_MESSAGES[error] || 'Ocurrió un error inesperado.'}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 border border-ldg-line bg-ldg-bg text-ldg-ink px-4 py-3 rounded text-sm font-semibold hover:bg-ldg-surface-alt transition-colors"
          >
            <GoogleIcon />
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    </div>
  )
}
