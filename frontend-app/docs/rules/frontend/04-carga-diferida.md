# 04 — Carga diferida (lazy loading)

Aplica a: rutas, componentes pesados y librerías. El bundle inicial debe ser
mínimo: el usuario descarga solo lo que necesita, cuando lo necesita.

| ID     | Regla                                                                                                                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-LZ-1 | **Rutas lazy obligatorias**: cada feature de dominio se carga con `loadComponent`/`loadChildren` en `app.routes.ts`; nada importa un dominio de forma estática desde `app.ts` o desde otra ruta (`R-AR-6`).                                                                                                               |
| R-LZ-2 | **`@defer` para UI pesada**: los bloques no críticos o below-the-fold (carruseles, modales, secciones de datos secundarias) se envuelven en `@defer` con el trigger adecuado: `on viewport` para lo que se ve al hacer scroll, `on idle` para lo secundario, `on interaction`/`on hover` para lo que abre con una acción. |
| R-LZ-3 | **Placeholders y estados del diferido**: todo `@defer` declara `@placeholder` (mínimo, sin salto de layout) y, cuando aporta, `@loading`/`@error`. No se difiere un bloque sin reservar su espacio.                                                                                                                       |
| R-LZ-4 | **Prefetch con criterio**: usar `prefetch on idle` para los bloques que el usuario probablemente abrirá; prohibido prefetch de todo "por si acaso".                                                                                                                                                                       |
| R-LZ-5 | **Preloading de rutas**: el valor por defecto es **no** precargar features grandes; si se activa `withPreloading(...)`, debe ser una decisión documentada y medible (`R-DO-2`).                                                                                                                                           |
| R-LZ-6 | **Frontera de import dinámico**: las dependencias pesadas (librerías grandes, editores, mapas) se importan **dentro** de la ruta o del `@defer` que las usa, no en el bundle inicial.                                                                                                                                     |

## Verificación

```bash
# rutas lazy (R-LZ-1): loadComponent/loadChildren, sin imports estáticos de dominios
grep -n "loadComponent\|loadChildren" src/app/app.routes.ts
# bloques diferidos existentes (R-LZ-2/3)
grep -rn "@defer" src --include=*.html
# el bundle inicial respeta el presupuesto (R-PF-1)
npm run build
```

## Notas

- Ya se usan rutas lazy y `@defer` (home, planes, carrito). Las reglas
  formalizan el uso y añaden placeholders donde falten.
- Cuidado con `shared/ui/index.ts` (barrels): importar un barrel puede arrastrar
  todo el directorio al bundle y anular el diferido; importar por ruta directa.
