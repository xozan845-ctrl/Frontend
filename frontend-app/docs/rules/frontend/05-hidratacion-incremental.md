# 05 — Hidratación incremental (SSR/SSG)

Aplica a: render en servidor y su hidratación en el cliente. **Hoy la app es
CSR zoneless** (`main.ts` hace `bootstrapApplication`, sin `@angular/ssr` ni
`provideClientHydration`). Por **ADR-09** se decidió **diferir** SSR/SSG: no es
una migración pendiente, sino una opción futura. Estas reglas son **condicionales**:
solo aplican si se adopta render en servidor, y su adopción requiere un ADR nuevo
(`R-DO-2`).

> **Zoneless y SSR son ortogonales**: se pueden combinar. Elegir zoneless (`R-PF-7`)
> no impide añadir SSR más adelante; el aplazamiento es por coste/beneficio.

| ID     | Regla                                                                                                                                                                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-HI-1 | **Hidratar solo con SSR**: la hidratación (`provideClientHydration(...)`) solo tiene sentido cuando hay HTML renderizado en servidor. Sin SSR no se configura; con SSR, se habilita `withEventReplay()` para no perder eventos previos a la hidratación.                                                                |
| R-HI-2 | **Hidratación incremental**: se habilita `provideClientHydration(withIncrementalHydration())` y se marcan con `@defer` los bloques no críticos. Los triggers de `R-LZ-2` (`on viewport`, `on interaction`, `on idle`) son también los triggers de hidratación: el HTML del servidor se hidrata por partes, no de golpe. |
| R-HI-3 | **Código seguro para el servidor**: prohibido tocar `window`, `document`, `localStorage` o `matchMedia` durante la construcción/init del componente. Ese acceso se aísla con `isPlatformBrowser`/`PLATFORM_ID` o se difiere a `afterNextRender` (`R-RB-4`, `R-SE-1`).                                                   |
| R-HI-4 | **Render determinista**: no renderizar en servidor valores que difieren entre servidor y cliente (`Date.now()`, `Math.random()`, idioma/zona del dispositivo); resolverlos tras la hidratación (`afterNextRender`) o con datos estables, para evitar _hydration mismatches_.                                            |
| R-HI-5 | **Sin IDs ni DOM aleatorios en servidor**: los identificadores de elementos y listas deben ser deterministas (ligados a datos), no generados con `Math.random()` en la plantilla.                                                                                                                                       |
| R-HI-6 | **Adopción medida**: si se introduce SSR/SSG/hidratación incremental, se justifica con métricas (LCP/INP) y un ADR nuevo; no se añade "porque sí" ni se activa incremental hydration sin medir. Hoy la decisión es **diferirlo** (ADR-09).                                                                              |

## Notas

- Si se habilita SSR, la persistencia actual (`AuthStore`, `CartStore`,
  `WishlistStore`, etc.) debe dejar de acceder a `localStorage` en el arranque
  (`R-HI-3`) y migrar la lectura a un servicio de almacenamiento inyectable que
  devuelva vacío en el servidor.
- `@defer` **bloqueado** (`when isVisible`) no se hidrata hasta la condición; usar
  triggers de viewport/interaction para el caso común.
