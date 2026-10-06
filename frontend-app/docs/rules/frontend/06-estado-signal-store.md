# 06 — Estado con NgRx Signal Store

Aplica al estado de la aplicación. El patrón canónico es
[`signalStore`](https://ngrx.io/guide/signals/signal-store) de `@ngrx/signals`.
Esta área profundiza `R-AR-5` (`../architecture/01-arquitectura.md`).

| ID     | Regla                                                                                                                                                                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-ST-1 | **Fuente única de verdad**: el estado compartido vive en **un** `signalStore`. Prohibido duplicar el mismo estado en un componente, en un servicio paralelo o en dos stores. La UI lee señales del store.                                                                              |
| R-ST-2 | **Composición de features**: el store se construye con `withState`, `withComputed`, `withMethods` y `withHooks`; para colecciones se usa `withEntities`/`withEntities` de `@ngrx/signals/entities`. Los stores complejos se descomponen en `signalStoreFeature` reutilizables.         |
| R-ST-3 | **Derivados en `withComputed`**: totales, filtros, orden, paginación y cualquier cálculo se exponen como `computed`. Prohibido calcular en la plantilla o esconderlo en getters que recalculan en cada ciclo (`R-PF-4`).                                                               |
| R-ST-4 | **Mutaciones con `withMethods` + `patchState`**: los cambios de estado son inmutables y nombrados por **intención de dominio** (`aplicarCupon`, `addItem`, `removeItem`); prohibido un `set(estado)` genérico que traslade reglas al componente (`R-CX-5`).                            |
| R-ST-5 | **Efectos con `rxMethod`**: las operaciones asíncronas (HTTP) se modelan con `rxMethod` en `withMethods`; se gestiona el ciclo con operadores (`switchMap` para cancelar lo obsoleto) y se actualiza `loading`/`error` en el mismo flujo. No dejar suscripciones colgando (`R-AR-10`). |
| R-ST-6 | **Alcance correcto del store**: `providedIn: 'root'` para estado global (auth, cart); store provisto en `providers` de una ruta/componente para estado de feature o efímero. Prohibido meter estado de UI efímero (abrir/cerrar un modal local) en un store global.                    |
| R-ST-7 | **Persistencia centralizada en `withHooks`**: la sincronización con `localStorage` ocurre en `withHooks(onInit)`, aislada y tolerante a JSON corrupto (`R-RB-4`); si se añade SSR, no acceder al storage en el arranque (`R-HI-3`).                                                    |

## Verificación

```bash
# uso del patrón y de las features (R-ST-2/3/4/5)
grep -rn "signalStore\|withState\|withComputed\|withMethods\|withHooks\|rxMethod\|patchState" src/app/domains
# duplicación de estado y cálculo en plantilla (debe estar acotado) — R-ST-1/3
grep -rn "BehaviorSubject" src/app || echo "sin BehaviorSubject (correcto)"
```

## Notas

- Stores actuales: `ProductStore`, `CartStore`, `AuthStore`, `WishlistStore`,
  `ReviewsStore`, `RecentlyViewedStore`; siguen el patrón y son la referencia.
- Deuda: persistencia del token en `AuthStore` (`R-SE-1`) y ausencia de tests de
  las transiciones de store (`R-U-8/9`).
