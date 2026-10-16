# Aplicar las correcciones de seguridad

## Orden de puesta en producción

1. Ejecutar `supabase/migrations/202610150001_enable_table_rls.sql` en Supabase SQL Editor si no se hizo antes. La captura del 15 de octubre confirma RLS para las cinco tablas originales.
2. Ejecutar `supabase/migrations/202610150002_app_security.sql`. Crea sesiones revocables, contadores atómicos de intentos, la asociación segura de pedidos y el bucket privado; restringe también las políticas de Storage. Es repetible y no borra pedidos ni clientes.
3. Con las variables de Supabase en `.env.local`, ejecutar `node scripts/prepare-security-storage.mjs` para revisar y `node scripts/prepare-security-storage.mjs --apply` para copiar y verificar la configuración en `server-settings`, conservando los originales mientras funciona la versión anterior. Si el destino ya existe, se conserva. La operación puede repetirse. No hacer cambios administrativos durante el traslado y despliegue, para evitar escrituras en el destino anterior.
4. Configurar `ADMIN_SECRET` y `AUTH_SECRET` en Vercel con valores aleatorios distintos de al menos 32 caracteres. Generar cada uno con `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. No compartirlos ni publicarlos. Los secretos generados en `.env.local` no se transfieren automáticamente a Vercel.
5. Conservar al menos un administrador autorizado: registro existente en `public.admins`, o usuario Auth confirmado con `app_metadata.role = admin` (solo modificable desde servidor/Dashboard), o su correo exacto en `SUPABASE_ADMIN_EMAILS`. El acceso opcional por variables requiere `ADMIN_USER` y una `ADMIN_PASSWORD` de al menos 12 caracteres. Un usuario Auth normal ya no obtiene acceso al panel.
6. Ejecutar `npm run test:security`, `npx tsc --noEmit`, `npm run build` y desplegar la versión validada. Comprobar catálogo, login de admin y cliente, registro, checkout, cambio de contraseña, cierre de sesión y subida de imágenes. Las cookies anteriores quedan invalidadas al actualizar.
7. Tras confirmar el despliegue, ejecutar `node scripts/prepare-security-storage.mjs --cleanup`. Guarda y verifica respaldos privados de los originales antes de retirarlos del bucket público. No ejecutar esta limpieza mientras la versión anterior siga usándolos.

Para instalaciones nuevas, `supabase/schema.sql` incluye ambas capas de seguridad.

## Comportamiento de seguridad

- RLS y permisos bloquean a `anon` y `authenticated` en tablas de aplicación y seguridad; las rutas del servidor utilizan `service_role`, que permanece solo en servidor. Auth usa otro cliente para evitar que una sesión cambie el rol del cliente compartido.
- Las sesiones caducan en servidor (admin: 8 horas; cliente: 7 días). La base guarda solo el hash del token. Logout borra esa sesión. Cambiar contraseña o correo, eliminar la cuenta o retirar el rol invalida el acceso; los cambios desde el panel también revocan sus sesiones. Cambiar el secreto correspondiente invalida todas las sesiones de ese tipo. No se registra la contraseña en sesiones.
- Para revocar manualmente todas las sesiones: `delete from public.security_sessions;` desde SQL Editor. Para una cuenta, filtrar por `kind` y `subject_id` (`db:<id>` / `auth:<uuid>` / `env` para admin, `<id>` para cliente).
- Los límites persisten en Postgres y son compartidos entre instancias: login 20 por IP y 5 por cuenta cada 15 minutos; registro 5 por IP y 3 por correo por hora; pedidos 10 por IP y 5 por correo cada 15 minutos. Las claves se derivan con HMAC y no guardan correos ni IP en claro. Si el contador o la configuración falla, se responde 503 sin realizar la operación. El contador individual se reinicia al vencer la ventana. Los registros vencidos se limpian al comprobar límites.
- En Vercel se utiliza `x-vercel-forwarded-for`. En otro hosting, el límite usa una identidad compartida salvo que `TRUST_PROXY=1` y un proxy de confianza reemplace `x-forwarded-for`. No activar esa variable en un servidor directamente accesible sin saneamiento de cabeceras.
- Las operaciones API exigen el mismo origen; las integraciones sin navegador deben enviar el `Origin` público exacto. `APP_ORIGIN` permite fijarlo detrás de un proxy. Las cookies son HttpOnly, SameSite=Lax y Secure en producción. HTTPS y cabeceras de seguridad se configuran para producción.
- El servidor calcula precios y total en centavos desde el catálogo; rechaza productos no disponibles, borradores, precios ocultos, cotizaciones y cantidades inválidas. El navegador solo determina slug y cantidad. Los cuerpos públicos JSON tienen límite de 32 KiB; nuevas contraseñas, de 12 a 256 caracteres.
- Los pedidos se consultan por `customer_id`, asignado por la sesión del servidor. Los pedidos históricos sin asociación siguen disponibles en el panel pero no se entregan a una cuenta solo por coincidir el correo. Asociarlos manualmente tras comprobar la identidad del comprador; no ejecutar un backfill masivo por correo sin verificación.
- `product-images` conserva solo medios públicos; las configuraciones pasan a `server-settings` privado. Las políticas restrictivas impiden escrituras públicas incluso si existen políticas permisivas. Las nuevas subidas rechazan SVG/HTML y el servidor comprueba la firma de formatos raster y fija el MIME; límite de 10 MiB. Las imágenes existentes no se transforman.
- `/api/health` devuelve únicamente `{ "ok": true }` y no consulta ni escribe en servicios externos.
- Cada página del panel verifica autorización antes de consultar datos; el layout también la verifica. Los formularios enviados al navegador excluyen hashes de contraseñas.

## Verificaciones externas pendientes

La seguridad del código no confirma la configuración efectiva del hosting. Verificar MFA en las cuentas de Supabase, Vercel y el repositorio, acceso del equipo, respaldos y restauración, alertas y registros. Revisar si hubo accesos indebidos durante la exposición anterior. Si una clave secreta fue expuesta, rotarla en el proveedor y actualizar el despliegue; el aviso de RLS por sí solo no demuestra filtración de claves. No rotar la clave pública como sustituto de RLS.

Mantener las dependencias actualizadas y ejecutar `npm audit --omit=dev`. No guardar credenciales en Git. El bucket público puede haber servido configuraciones antes del traslado: borrar el original no elimina copias ya descargadas o cacheadas por terceros.
