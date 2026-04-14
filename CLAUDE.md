# Frontend — React + Vite

## Stack
- React 18
- Vite 5
- Tailwind CSS 3
- React Router DOM 6
- Axios (llamadas API)
- html2canvas (exportar factura como imagen)
- react-hot-toast (notificaciones)

## Estructura
```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.local           # VITE_API_URL (no se sube)
└── src/
    ├── main.jsx         # entry point, BrowserRouter, Toaster
    ├── App.jsx          # rutas principales
    ├── index.css        # directivas Tailwind + @media print
    ├── api/
    │   └── index.js     # todas las llamadas al backend con axios
    ├── components/
    │   └── Layout.jsx   # navbar + Outlet
    └── pages/
        ├── Dashboard.jsx       # lista de pedidos
        ├── NuevoPedido.jsx     # formulario crear pedido
        ├── PedidoDetalle.jsx   # ver/editar pedido con clientes e items
        ├── Clientes.jsx        # gestionar clientes y aliases
        └── Factura.jsx         # vista de impresión + exportar imagen
```

## Variables de entorno
```
VITE_API_URL    # URL del backend (Railway en prod, localhost:8000 en dev)
```

## Correr localmente
```bash
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

## Convenciones
- Sin emojis en código fuente
- Sin valores hardcodeados — todo desde import.meta.env o props
- Componentes en PascalCase, funciones utilitarias en camelCase
- Llamadas a la API siempre en src/api/index.js, nunca directas en componentes
- Manejo de errores con toast.error() en catch
- La clase CSS `no-print` oculta elementos en modo impresión
- Los valores monetarios se muestran con toFixed(2)
