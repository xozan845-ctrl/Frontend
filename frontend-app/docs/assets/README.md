# Assets de documentación

## `og-image.html`

Fuente de [`public/og-image.png`](../../public/og-image.png): la imagen Open Graph
por defecto (1200 × 630). El [`SeoService`](../../src/app/core/services/seo.service.ts)
la publica como `og:image` y `twitter:image` en las páginas genéricas, y también
la restaura en `reset()`.

Regenerar tras editar el diseño:

```bash
npx playwright install chromium   # solo la primera vez
npm run og-image
```

El script `scripts/generate-og-image.mjs` renderiza el HTML con Chromium a
`deviceScaleFactor: 1` y sobrescribe el PNG. Usa una pila de fuentes del sistema
(Helvetica/Arial/Liberation/DejaVu) para que el resultado no dependa de la red.

Notas de diseño:

- Fondo `#0a0a0a` con glow y rejilla sutil; acento `#0055ff` (tokens de marca).
- Zona segura: el contenido relevante vive dentro de los 96 px de padding.
- El wordmark y la tagline deben seguir legibles en previews pequeños.
