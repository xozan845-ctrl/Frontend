# 07 — Rendimiento

Aplica a: peso del bundle, carga de imágenes, carga diferida, trabajo en
ejecución y el modelo de detección de cambios (zoneless).

| ID     | Regla                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-PF-1 | **Presupuestos de build**: `npm run build` no puede superar los budgets de `angular.json` — `initial` con **aviso a 545 kB** y **error a 560 kB** (ratchet sobre 543.45 kB reales), y `anyComponentStyle` con aviso a 4 kB y error a 8 kB. El job `build` convierte el aviso en gate con `scripts/check-budget.mjs` (`R-CI-8`). Subir un presupuesto exige justificación en el PR (`R-PR-4`); la respuesta por defecto es reducir el peso. |
| R-PF-2 | **Imágenes optimizadas**: usar `NgOptimizedImage` con `width`/`height` (o `fill`), `loading="lazy"` salvo above-the-fold; la imagen principal del detalle puede marcarse `priority`. Prohibido usar `<img>` sin dimensiones en contenido de lista.                                                                                                                                                                                         |
| R-PF-3 | **Carga diferida**: el bundle inicial no importa estáticamente features de dominio (`R-AR-6`); rutas lazy y `@defer` según `R-LZ-*`.                                                                                                                                                                                                                                                                                                       |
| R-PF-4 | **Sin trabajo pesado en plantilla**: prohibido invocar funciones costosas en el HTML (filtrado, orden, formateo repetido). Los derivados se calculan una vez en `computed`/`withComputed` (`R-ST-3`) y el formato de presentación vive en un pipe o un VM. Verificado por `performance-guards`: métodos propios del componente en interpolaciones y bindings de propiedad.                                                                 |
| R-PF-5 | **Diferido de UI pesada**: bloques no críticos (carruseles, secciones below-the-fold, modales) se envuelven en `@defer` cuando su coste lo justifique (`R-LZ-2/3`).                                                                                                                                                                                                                                                                        |
| R-PF-6 | **Sin sondeo innecesario**: prohibido `setInterval`/`setTimeout` para esperar estado que ya es reactivo. Usar `effect`, signals o el `subscribe` adecuado. La suite `performance-guards` lo verifica en `features/`.                                                                                                                                                                                                                       |
| R-PF-7 | **Zoneless y estado reactivo**: la app **no usa `zone.js`**; la detección de cambios se dispara por signals. Toda mutación de estado pasa por `signal.set/update` o `patchState`; prohibido mutar objetos/arreglos en sitio esperando que Angular reaccione (`R-ST-4`), y prohibido añadir `zone.js` sin un ADR que lo justifique.                                                                                                         |

| R-PF-8 | **Lighthouse en CI**: el job `lighthouse` ejecuta `lhci autorun` (mediana de **3 runs**) sobre el build estático con umbrales mínimos (performance 0.70, accesibilidad 0.95, best-practices 0.90, SEO 0.85). Bajar un umbral exige justificación en el PR (`R-PR-4`). |

## Verificación

```bash
npm run build            # budgets: no debe fallar por exceso de peso (R-PF-1)
node scripts/cli.mjs rules --only performance-guards   # R-PF-4/6/7
grep -rn "zone.js" package.json angular.json           # R-PF-7: no debe aparecer
```
