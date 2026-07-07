# bayronlondono.com

Sitio web personal de **Bayron Londoño** — turismo experiencial, hospitalidad, café y fotografía.
*La elegancia de servir en silencio.*

## Stack

HTML + CSS + JavaScript vanilla. Sin frameworks, sin build step. GSAP + ScrollTrigger locales en `lib/`.

## Estructura

```
index.html        página principal (one-page)
creditos.html     atribución de imágenes provisionales (Creative Commons)
branding/         manual de marca interno — solo por URL directa, no indexado
styles.css        estilos (design system de marca)
main.js           interacciones (reveals, nav, parallax)
lib/manifest.js   datos de contacto y marca (editar aquí WhatsApp/Instagram)
assets/img/       imágenes
vercel.json       cache y cabeceras para Vercel
```

## Deploy

Vercel, conectado a este repositorio. Cada push a `main` publica automáticamente.

## Notas

- Las fotos actuales son provisionales (stock CC) — se reemplazarán por fotografía propia.
- Para activar el botón de WhatsApp: editar `contact.whatsapp` en `lib/manifest.js` y subir el cambio.
- Al cambiar CSS o JS, actualizar el `?v=YYYYMMDD` en los HTML.
