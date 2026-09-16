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

## Próximos pasos (fase backend)

1. Sustituir el almacén JSON (`data/db.json`) por una base de datos real (Postgres/MySQL/SQLite + Prisma).
2. Notificaciones de pedidos (email/WhatsApp al admin y al cliente).
3. Autenticación de clientes (`/my-account`) y wishlist persistente.
4. Pasarela de pago opcional (Yappy, tarjeta).
5. Deploy (Vercel u otro hosting).
