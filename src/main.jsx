import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// Si el backend redirige con ?token=xxx, guardarlo antes de que React monte
const _params = new URLSearchParams(window.location.search)
const _token = _params.get('token')
if (_token) {
  localStorage.setItem('token', _token)
  window.history.replaceState({}, '', window.location.pathname)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" />
    </BrowserRouter>
  </React.StrictMode>,
)
