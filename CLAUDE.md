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
    │   ├── SidePanel.jsx     # panel lateral deslizable (reemplaza modales); role=dialog, foco al abrir
    │   ├── ImageUpload.jsx   # click = selector de archivo, drag&drop o Ctrl+V; con imagen, click = lightbox
    │   ├── Lightbox.jsx      # visor de imagen a pantalla completa via createPortal
    │   └── Cargando.jsx      # esqueleto de carga comun a todas las paginas
    ├── utils/
    │   ├── avatar.js         # initials() / avatarClass()
    │   ├── fecha.js          # fechaCorta/fechaLarga/fechaHora (Intl) + hoyLocal()
    │   └── copiarImagen.js   # html2canvas (import diferido) -> portapapeles / share / descarga
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
- `/factura/:pcId?pedido=<id>` — Factura imprimible (protegida). El `?pedido=` hace el enlace recargable; sessionStorage `pedido_id_para_factura` queda solo como respaldo de enlaces viejos
- `/c/:token` — Historial publico del cliente (SIN login)
- `/p/:token` — Factura publica por token (SIN login, para compartir por WhatsApp)

## Autenticacion
- JWT guardado en localStorage bajo la clave `token`
- main.jsx extrae `?token=` de la URL sincrónicamente antes de que React monte
- PrivateRoute redirige a /login si no hay token
- Interceptor de respuesta: si llega 401, limpia token y redirige a /login
- Session dura 1 dia; al vencer el backend retorna 401 y se redirige automaticamente

## Variables de entorno
```
VITE_API_URL         # URL del backend (obligatoria; sin fallback a localhost)
VITE_APP_TITLE       # titulo en index.html
VITE_EMISOR_NOMBRE   # opcionales: cabecera de Factura.jsx; no se hardcodean datos personales
VITE_EMISOR_EMAIL
VITE_EMISOR_CIUDAD
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
- Errores siempre con `toast.error(errorMsg(err, 'fallback'))` (helper de `src/api`): usa el `detail` del backend si es texto y distingue "sin conexion"
- Botones de envio: deshabilitados + "Guardando…" mientras dura el request (evita pagos/items duplicados por doble click)
- Fechas siempre via `src/utils/fecha.js`. Las fechas 'YYYY-MM-DD' se parsean como locales (con `new Date(iso)` se corren un dia en UTC-5). Para "hoy" usar `hoyLocal()`, nunca `toISOString()`
- Tema: lo aplica un script inline en index.html ANTES del render (sin destello). Las rutas `/p/` y `/c/` se fuerzan claras porque las abre el cliente final. `color-scheme` va en `:root`/.dark
- Colores Tailwind `ldg-*` son `var(--...)`: el modificador de opacidad (`/30`) NO funciona con ellos
- Filas de tabla navegables: `<Link>` "estirado" (`after:absolute after:inset-0`) en la primera celda + fila `relative`; los botones de la fila llevan `relative z-10`. No usar `<div onClick>` (rompe Ctrl+click y teclado)
- Filtros/busqueda/pestañas que conviene conservar al volver atras van en la URL (`useSearchParams`): Dashboard `?q=&estado=`, ClienteDetalle `?vista=`
- Formularios se abren en SidePanel, nunca inline ni en modal
- La clase CSS no-print oculta elementos en impresion
- Valores monetarios con .toFixed(2)
- ImageUpload: sin imagen, click abre el selector (en movil, camara/galeria), tambien drag&drop y Ctrl+V al tener foco. `pegarGlobal` escucha el pegado en todo el documento mientras esta montado (se usa dentro de paneles). Solo intercepta pegados con imagen, el texto sigue llegando a los inputs. Con imagen, "cambiar" y la x se ven con hover/foco y siempre en pantallas touch
- FacturaPublica y ClientePublico son siempre claras y usan la paleta Ledger (no Tailwind gris/azul generico)
- La comision mostrada por pedido-cliente es la historica (guardada al momento de agregar al pedido), no la comision actual del cliente
- Avatares (bolitas con iniciales): usar `initials()` y `avatarClass()` de `src/utils/avatar.js`. El color sale de un hash del nombre, asi cada cliente conserva SU color en toda la app (no depende del indice de fila). NO redefinir paletas locales por pagina. El degradado/anillo decorativo vive en las clases `.av`/`.av-0..4` de index.css

## Patrones UI
- SidePanel para: agregar cliente, agregar item, registrar pago, crear/editar cliente (con sus alias)
- Panel "Nuevo artículo": incluye la foto (pegar/arrastrar/elegir) y se sube justo despues de `createItem`. El panel NO se cierra al agregar: resetea el form y enfoca el link para cargar el siguiente articulo ("Listo"/Esc cierra). El numero del item es max(numero)+1 del pedido-cliente fresco
- Panel "Registrar pago": incluye comprobante opcional (se sube tras `createPago`) y atajo "Usar saldo completo"
- Panel "Agregar cliente": combobox con teclado (flechas/Enter) que busca por nombre y alias; si no hay coincidencia exacta ofrece "Crear cliente «X» y agregarlo" (usa la comision por defecto del backend)
- PedidoDetalle: tras una mutacion se llama `recargar()` (solo `getPedido`); `cargar()` (pedido + clientes + pedidos) es solo la carga inicial. El toggle activo es optimista
- PedidoDetalle, cabecera de cada cliente: "Factura" y "Copiar mensaje" visibles; mover cliente / mover articulos / quitar del pedido van en el menu ⋯ (quitar, en rojo y separado)
- El mensaje de WhatsApp ("Copiar mensaje") lista SOLO articulos activos, igual que la factura
- Dashboard: StatCards arriba + buscador (filtra por cliente, numero o fecha) + lista de pedidos
- PedidoDetalle: "Factura" abre /factura/:pcId?pedido=:id; "Copiar mensaje" copia resumen + /p/:token; "Exportar Excel" descarga el .xlsx del pedido completo
- Clientes: los alias se ven como "también: …" en la fila y se agregan/quitan desde el panel de edicion (no hay input por fila)
- "Copiar imagen" (Factura, FacturaPublica, ClientePublico) usa `copiarImagen()`: en movil casi nunca hay clipboard de imagenes, por eso cae a share sheet o descarga. En FacturaPublica captura cabecera + items + pagos
- PedidoDetalle, mover artículos: cada cliente con items tiene un boton "mover ítems" (distinto de "mover", que mueve al cliente entero a otro pedido). Abre un SidePanel con checkboxes por artículo + select de pedido destino (default este pedido; al elegir otro se hace `getPedido` para traer sus clientes) + select de cliente destino + input de confirmacion donde hay que teclear `MOVER` (anti-misclick estilo GitHub; el boton queda disabled hasta que coincida). Llama a `moverItems(pcId, itemIds, destinoPcId)`. El destino se elige entre PedidoCliente ya existentes (no se crea cliente nuevo desde aqui)
- ClienteDetalle: ResumenCards + dos pestañas: "Pedidos" (historial con barra de progreso de pago) y "Transacciones" (linea de tiempo cronologica de todos los pagos de todos los pedidos, con monto y acumulado pagado). Ambas vistas usan los datos del mismo endpoint `getHistorialCliente`
- Los registros eliminados no aparecen en la UI (el backend los filtra); el borrado es siempre logico

## Export Excel
- Boton "Exportar Excel" en cabecera de PedidoDetalle (verde, junto a "+ Agregar cliente")
- Llama a `exportPedidoExcel(id)` con `responseType: 'blob'`, crea un object URL y dispara descarga
- Nombre del archivo: `Pedido_{numero}_{fecha}.xlsx`
