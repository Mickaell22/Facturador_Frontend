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
├── public/
│   └── favicon.webp
├── .env.local           # VITE_API_URL (no se sube)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   └── index.js         # todas las llamadas al backend con axios
    ├── components/
    │   ├── Layout.jsx        # navbar + Outlet
    │   ├── SidePanel.jsx     # panel lateral deslizable (reemplaza modales)
    │   └── ImageUpload.jsx   # subida de imagen via Ctrl+V, drag&drop o file picker
    └── pages/
        ├── Dashboard.jsx       # cards de metricas + lista de pedidos
        ├── NuevoPedido.jsx     # formulario crear pedido
        ├── PedidoDetalle.jsx   # ver/editar pedido con clientes, items y pagos
        ├── Clientes.jsx        # lista de clientes con aliases
        ├── ClienteDetalle.jsx  # historial completo de un cliente con totales
        └── Factura.jsx         # resumen imprimible + exportar como imagen
```

## Rutas
- `/` — Dashboard
- `/pedidos/nuevo` — Crear pedido
- `/pedidos/:id` — Detalle de pedido
- `/clientes` — Lista de clientes
- `/clientes/:id` — Historial de cliente
- `/factura/:pcId` — Factura imprimible (requiere pedido_id en sessionStorage)

## Variables de entorno
```
VITE_API_URL    # URL del backend
```

## Correr localmente
```bash
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

## Convenciones
- Sin emojis en codigo fuente
- Sin valores hardcodeados
- Componentes en PascalCase, funciones en camelCase
- Todas las llamadas API en src/api/index.js
- Errores siempre con toast.error() en catch
- Formularios se abren en SidePanel, nunca inline ni en modal
- La clase CSS no-print oculta elementos en impresion
- Valores monetarios con .toFixed(2)
- ImageUpload: click = enfoca para Ctrl+V, con imagen = hover muestra "cambiar"

## Patrones UI
- SidePanel se usa para: agregar cliente, agregar item, registrar pago, crear/editar cliente
- Dashboard muestra StatCards con metricas globales arriba y lista de pedidos abajo
- ClienteDetalle muestra ResumenCards + historial con barra de progreso de pago
