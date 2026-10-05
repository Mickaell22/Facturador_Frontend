import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// El backend redirige con #token=xxx (fragmento: no queda en logs ni Referer).
// ?token= se mantiene por compatibilidad con backends anteriores.
const _token = new URLSearchParams(window.location.hash.slice(1)).get('token')
  || new URLSearchParams(window.location.search).get('token')
if (_token) {
  localStorage.setItem('token', _token)
  window.history.replaceState({}, '', window.location.pathname)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--ldg-surface)',
            color: 'var(--ldg-ink)',
            border: '1px solid var(--ldg-line)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--ldg-success)', secondary: 'var(--ldg-surface)' } },
          error:   { iconTheme: { primary: 'var(--ldg-danger)',  secondary: 'var(--ldg-surface)' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
