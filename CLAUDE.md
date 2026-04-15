# Frontend — React + Vite

## Stack
- React 18
- Vite 5
- Tailwind CSS 3 (darkMode: 'class')
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
    ├── main.jsx             # extrae ?token= de URL antes de montar React
    ├── App.jsx              # rutas + PrivateRoute
    ├── index.css
    ├── api/
    │   └── index.js         # axios con interceptores JWT; getFacturaPublica sin auth
    ├── hooks/
    │   └── useDarkMode.js   # persiste preferencia en localStorage
    ├── components/
    │   ├── Layout.jsx        # navbar + boton Salir + toggle dark mode
    │   ├── SidePanel.jsx     # panel lateral deslizable (reemplaza modales)
    │   └── ImageUpload.jsx   # subida de imagen via Ctrl+V o file picker
    └── pages/
        ├── Login.jsx           # login con Google (unico metodo, sin registro)
        ├── Dashboard.jsx       # stats + lista de pedidos con buscador
        ├── NuevoPedido.jsx     # formulario crear pedido
        ├── PedidoDetalle.jsx   # ver/editar pedido; boton "Copiar enlace" por cliente
        ├── Clientes.jsx        # lista de clientes con aliases
        ├── ClienteDetalle.jsx  # historial completo de un cliente con totales
        ├── Factura.jsx         # resumen imprimible (requiere JWT)
        └── FacturaPublica.jsx  # resumen publico por token (sin login)
```

## Rutas
- `/login` — Pantalla de login con Google
- `/` — Dashboard (protegida)
- `/pedidos/nuevo` — Crear pedido (protegida)
- `/pedidos/:id` — Detalle de pedido (protegida)
- `/clientes` — Lista de clientes (protegida)
- `/clientes/:id` — Historial de cliente (protegida)
- `/factura/:pcId` — Factura imprimible (protegida, requiere pedido_id en sessionStorage)
- `/p/:token` — Factura publica por token (SIN login, para compartir por WhatsApp)

## Autenticacion
- JWT guardado en localStorage bajo la clave `token`
- main.jsx extrae `?token=` de la URL sincrónicamente antes de que React monte
- PrivateRoute redirige a /login si no hay token
- Interceptor de respuesta: si llega 401, limpia token y redirige a /login
- Session dura 1 dia; al vencer el backend retorna 401 y se redirige automaticamente

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
- Errores siempre con toast.error() en catch; mostrar err.response?.data?.detail si existe
- Formularios se abren en SidePanel, nunca inline ni en modal
- La clase CSS no-print oculta elementos en impresion
- Valores monetarios con .toFixed(2)
- ImageUpload: click = enfoca para Ctrl+V, con imagen = hover muestra "cambiar"
- FacturaPublica y Login tienen fondo blanco fijo (no dependen del Layout)

## Patrones UI
- SidePanel para: agregar cliente, agregar item, registrar pago, crear/editar cliente
- Dashboard: StatCards arriba + buscador (filtra por cliente, numero o fecha) + lista de pedidos
- PedidoDetalle: boton "Ver factura" abre /factura/:pcId; "Copiar enlace" copia /p/:token al portapapeles
- ClienteDetalle: ResumenCards + historial con barra de progreso de pago
- Los registros eliminados no aparecen en la UI (el backend los filtra); el borrado es siempre logico
