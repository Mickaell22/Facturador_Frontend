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
    │   ├── ImageUpload.jsx   # subida de imagen via Ctrl+V o file picker; click = lightbox
    │   └── Lightbox.jsx      # visor de imagen a pantalla completa via createPortal
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

## Deploy en Railway (serverless)
- Frontend es una SPA estatica servida desde Railway
- `VITE_API_URL` apunta al backend en produccion: `https://facturadorbackend-production.up.railway.app`
- En modo serverless el frontend siempre esta disponible; los cold starts afectan solo al backend

## Items activos / inactivos
- Cada item tiene `item.activo` (bool). En PedidoDetalle el boton circular de cada item lo activa/desactiva (`toggleActivo`); los inactivos se ven tachados/atenuados pero siguen en la lista
- Las facturas (`Factura.jsx`, `FacturaPublica.jsx`) muestran SOLO los items activos (`items.filter(i => i.activo)`); los inactivos no aparecen y no suman al total (el backend ya manda los totales calculados solo con activos)
- El historial de cliente usa `items_activos` del backend (antes `items_llegados`)

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
- La comision mostrada por pedido-cliente es la historica (guardada al momento de agregar al pedido), no la comision actual del cliente
- Avatares (bolitas con iniciales): usar `initials()` y `avatarClass()` de `src/utils/avatar.js`. El color sale de un hash del nombre, asi cada cliente conserva SU color en toda la app (no depende del indice de fila). NO redefinir paletas locales por pagina. El degradado/anillo decorativo vive en las clases `.av`/`.av-0..4` de index.css

## Patrones UI
- SidePanel para: agregar cliente, agregar item, registrar pago, crear/editar cliente
- Dashboard: StatCards arriba + buscador (filtra por cliente, numero o fecha) + lista de pedidos
- PedidoDetalle: boton "Ver factura" abre /factura/:pcId; "Copiar enlace" copia /p/:token al portapapeles; "Exportar Excel" descarga el .xlsx del pedido completo
- PedidoDetalle, mover artículos: cada cliente con items tiene un boton "mover ítems" (distinto de "mover", que mueve al cliente entero a otro pedido). Abre un SidePanel con checkboxes por artículo + select de pedido destino (default este pedido; al elegir otro se hace `getPedido` para traer sus clientes) + select de cliente destino + input de confirmacion donde hay que teclear `MOVER` (anti-misclick estilo GitHub; el boton queda disabled hasta que coincida). Llama a `moverItems(pcId, itemIds, destinoPcId)`. El destino se elige entre PedidoCliente ya existentes (no se crea cliente nuevo desde aqui)
- ClienteDetalle: ResumenCards + dos pestañas: "Pedidos" (historial con barra de progreso de pago) y "Transacciones" (linea de tiempo cronologica de todos los pagos de todos los pedidos, con monto y acumulado pagado). Ambas vistas usan los datos del mismo endpoint `getHistorialCliente`
- Los registros eliminados no aparecen en la UI (el backend los filtra); el borrado es siempre logico

## Export Excel
- Boton "Exportar Excel" en cabecera de PedidoDetalle (verde, junto a "+ Agregar cliente")
- Llama a `exportPedidoExcel(id)` con `responseType: 'blob'`, crea un object URL y dispara descarga
- Nombre del archivo: `Pedido_{numero}_{fecha}.xlsx`
