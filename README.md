# 🛒 Facturador Temu — Frontend

Interfaz web para gestionar pedidos grupales de Temu. Responsive, funciona en celular y PC.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Railway](https://img.shields.io/badge/Railway-Deploy-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

---

## Características

- **Dashboard** con lista de pedidos, estados y resumen rápido
- **Gestión de pedidos**: crear, editar, agregar clientes e items
- **Artículos**: registrar link de Temu, precio, imagen y marcar como llegado
- **Pagos**: registrar múltiples abonos con foto del comprobante
- **Factura por cliente**: vista de resumen con totales calculados
- **Exportar PDF**: impresión directa desde el navegador
- **Copiar como imagen**: captura la factura y la copia al portapapeles (para pegar en WhatsApp o Telegram)
- **Gestión de clientes**: normalización de nombres con aliases y comisión individual
- **Rutas públicas por token**: historial y factura del cliente sin login (para compartir por WhatsApp)
- **Autenticación con Google** — solo el email autorizado puede acceder
- Diseño **responsive** — funciona en celular y PC

---

## Estructura del proyecto

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── .env.local          # URL del backend (no se sube)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── api/             # llamadas al backend
    ├── components/      # componentes reutilizables
    └── pages/
        ├── Login.jsx            # Google OAuth
        ├── Dashboard.jsx
        ├── NuevoPedido.jsx
        ├── PedidoDetalle.jsx
        ├── Clientes.jsx
        ├── ClienteDetalle.jsx
        ├── Factura.jsx
        ├── FacturaPublica.jsx   # /p/:token — sin login
        └── ClientePublico.jsx   # /c/:token — sin login
```

---

## Variables de entorno

Crea un archivo `.env.local`:

```env
VITE_API_URL=https://tu-backend.railway.app
```

---

## Instalación local

```bash
# Instalar dependencias
npm install

# Configurar variable de entorno
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Correr servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## Build para producción

```bash
npm run build
```

Genera la carpeta `/dist` lista para desplegarse en Railway o Vercel.

---

## Deploy en Railway

1. Conecta este repositorio en [Railway](https://railway.app)
2. Agrega la variable de entorno `VITE_API_URL` apuntando al backend
3. Railway detecta Vite automáticamente y hace el build
4. Se genera una URL pública accesible desde cualquier dispositivo

---

## Dependencias principales

| Paquete | Uso |
|---------|-----|
| `react-router-dom` | Navegación entre páginas |
| `axios` | Llamadas a la API |
| `html2canvas` | Exportar factura como imagen |
| `react-hot-toast` | Notificaciones |
