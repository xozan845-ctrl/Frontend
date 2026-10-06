# 07 — Rendimiento

Aplica a: peso del bundle, carga de imágenes, carga diferida, trabajo en
ejecución y el modelo de detección de cambios (zoneless).

| ID     | Regla                                                                                                                                                                                                                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-PF-1 | **Presupuestos de build**: `npm run build` no puede superar los budgets de `angular.json` — `initial` con aviso a 500 kB y error a 1 MB; `anyComponentStyle` con aviso a 4 kB y error a 8 kB. Subir un presupuesto exige justificación en el PR (`R-PR-4`); la respuesta por defecto es reducir el peso.                           |
| R-PF-2 | **Imágenes optimizadas**: usar `NgOptimizedImage` con `width`/`height` (o `fill`), `loading="lazy"` salvo above-the-fold; la imagen principal del detalle puede marcarse `priority`. Prohibido usar `<img>` sin dimensiones en contenido de lista.                                                                                 |
| R-PF-3 | **Carga diferida**: el bundle inicial no importa estáticamente features de dominio (`R-AR-6`); rutas lazy y `@defer` según `R-LZ-*`.                                                                                                                                                                                               |
| R-PF-4 | **Sin trabajo pesado en plantilla**: prohibido invocar funciones costosas en el HTML (filtrado, orden, formateo repetido). Los derivados se calculan una vez en `computed`/`withComputed` (`R-ST-3`).                                                                                                                              |
| R-PF-5 | **Diferido de UI pesada**: bloques no críticos (carruseles, secciones below-the-fold, modales) se envuelven en `@defer` cuando su coste lo justifique (`R-LZ-2/3`).                                                                                                                                                                |
| R-PF-6 | **Sin sondeo innecesario**: prohibido `setInterval`/`setTimeout` para esperar estado que ya es reactivo. Usar `effect`, signals o el `subscribe` adecuado. (Deuda conocida: `product-detail` sondea con `setInterval` — ver AUDIT.)                                                                                                |
| R-PF-7 | **Zoneless y estado reactivo**: la app **no usa `zone.js`**; la detección de cambios se dispara por signals. Toda mutación de estado pasa por `signal.set/update` o `patchState`; prohibido mutar objetos/arreglos en sitio esperando que Angular reaccione (`R-ST-4`), y prohibido añadir `zone.js` sin un ADR que lo justifique. |

## Verificación

```bash
npm run build            # budgets: no debe fallar por exceso de peso (R-PF-1)
grep -rn "setInterval\|setTimeout" src/app/domains   # R-PF-6
grep -rn "zone.js" package.json angular.json         # R-PF-7: no debe aparecer
```
