# Tass Loco 507 — Rediseño (frontend)

Rediseño de [tassloco507.com](https://tassloco507.com), tienda online de piezas de auto,
accesorios racing y ropa streetwear en Panamá 🇵🇦.

> **Fase actual: diseño / frontend.** Backend, base de datos y deploy se trabajan después.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- CSS propio (sin framework de UI) — estética *street / graffiti*
- Catálogo importado desde la API pública de WooCommerce Store API (322 productos, 20 categorías)

## Colores y estilo

- Fondo blanco, rojo `#DD3333` y negro.
- Tipografías: Bungee (display), Anton (títulos), Permanent Marker (tags graffiti), Archivo (cuerpo).
- Elementos: salpicaduras, damero racing, rayas de precaución, stickers rotados, marquesina.

## URLs preservadas (slugs originales)

| Ruta | Descripción |
| --- | --- |
| `/` | Home |
| `/shop` | Tienda (con búsqueda y filtros) |
| `/producto/[slug]` | Detalle de producto |
| `/categoria-producto/[...slug]` | Categorías (con jerarquía) |
| `/cart` | Carrito |
| `/checkout` | Checkout |
| `/sobre-nosotros` | Sobre nosotros |
| `/contacto` | Contacto |
| `/faq` | Preguntas frecuentes |
| `/request-quote` | Cotizar pieza |
| `/wishlist`, `/my-account` | Placeholders (listos para backend) |

## Métodos de pago (checkout)

- **Transferencia bancaria** (con datos de cuenta + instrucciones)
- **Efectivo** (pago contra entrega)
- **Sin procesamiento de pago en línea**: el pedido se registra con estado `pendiente` y se confirma manualmente desde el admin.

## Panel de administración

- URL: **`/admin`** (ej. `http://localhost:3000/admin`)
- Credenciales por defecto: usuario **`admin`** · contraseña **`tassloco507`**
- Cambiarlas con variables de entorno: `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET`.

Funciones:
- **Productos**: listar, buscar, crear, editar y eliminar (CRUD). Los cambios se reflejan al instante en la tienda.
- **Galería de productos**: imagen destacada + galería de imágenes, con subida arrastrando/clic o desde la **galería de medios** (los archivos se guardan en `public/uploads/`).
- **Categorías**: crear, editar y eliminar (con jerarquía padre/hijo).
- **Pedidos**: listar, editar por completo (artículos, cliente, entrega, pago, estado) y cambiar estado (pendiente → confirmado → despachado → entregado → cancelado).
- **Clientes**: los clientes se registran en `/registro` e inician sesión en `/login` (su cuenta en `/my-account`); en el admin puedes ver la lista de clientes y sus pedidos.

Los datos se guardan en `data/db.json` (almacén JSON simple; se sustituye por una base de datos real en la fase de deploy).

## Datos

- `data/products.json` — catálogo completo (nombre, slug, precio, imágenes, categorías, stock, descripción).
- `data/categories.json` — categorías con jerarquía padre/hijo.
- `scripts/scrape.mjs` — script para re-importar el catálogo desde la web en vivo.

```bash
node scripts/scrape.mjs
```

## Desarrollo

```bash
npm install --cache ".npm-cache"   # si npm no puede usar la caché global
npm run dev                        # http://localhost:3000
npm run build
npm run start
```

## Estructura

```
app/                    # rutas (App Router)
  page.tsx              # home
  shop/page.tsx
  producto/[slug]/page.tsx
  categoria-producto/[[...slug]]/page.tsx
  cart/page.tsx
  checkout/page.tsx
  ...
components/             # componentes reutilizables
lib/                    # catálogo, tipos, dinero, config del sitio
data/                   # productos y categorías importados
scripts/scrape.mjs      # importador del catálogo
```

## Deploy (Vercel + GitHub + Resend)

### 1. Subir a GitHub
```bash
git remote add origin https://github.com/TU-USUARIO/tassloco507.git
git push -u origin main
```

### 2. Conectar a Vercel
1. En [vercel.com](https://vercel.com) → **New Project** → importa el repo de GitHub.
2. Framework **Next.js** (se detecta solo; no hace falta `vercel.json`).
3. En **Settings → Environment Variables** copia las variables de `.env.example`.

### 3. Resend (correos)
1. Crea cuenta en [resend.com](https://resend.com) y **verifica tu dominio**.
2. Crea una **API key** → `RESEND_API_KEY`.
3. `EMAIL_FROM` debe ser un remitente verificado (ej. `pedidos@tassloco507.com`).

Al recibir un pedido se envía: confirmación al cliente + aviso al admin (`ADMIN_EMAIL`).

### ⚠️ Base de datos (obligatorio antes de producción)
Hoy los productos, pedidos, clientes y categorías se guardan en `data/db.json`, y las imágenes en `public/uploads/`. **Esto no persiste en Vercel** (filesystem efímero y de solo lectura).

Para producción hay que migrar a:
- **Base de datos**: Vercel Postgres / Neon (Postgres alojado).
- **Imágenes**: Vercel Blob (en vez de `public/uploads`).

## Próximos pasos

1. Migrar persistencia a Postgres (Vercel Postgres/Neon) + Vercel Blob para imágenes.
2. Notificaciones por WhatsApp al admin (además del correo de Resend).
3. Pasarela de pago opcional (Yappy, tarjeta).
