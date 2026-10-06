# 02 — Reglas de Tests de Componentes (TestBed)

Aplica a: componentes con lógica (formularios, eventos, inputs condicionales,
salidas). Se ejecutan con **Angular TestBed** dentro de Vitest, sin red real.

| ID     | Regla                                                                                                                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CP-1 | Todo componente con lógica tiene spec: creación, interacción simulada (`click`, `input`, submit) y el estado que produce. Un componente puramente presentacional solo requiere que renderice.                  |
| R-CP-2 | Los selectores usan `data-testid` (preferido) o roles/etiquetas accesibles. Prohibido seleccionar por clases Tailwind o por estructura frágil del DOM.                                                         |
| R-CP-3 | Los inputs se fijan con `fixture.componentRef.setInput(...)` y las salidas se verifican suscribiéndose al `output`/`EventEmitter`; se asienta el estado visible, no las propiedades privadas.                  |
| R-CP-4 | Los stores y servicios se sustituyen por dobles vía `providers` (`useValue`/`useClass`/`useFactory`). **Prohibido** `HttpClient` real: se usa `provideHttpClientTesting` cuando el componente dependa de HTTP. |
| R-CP-5 | Todo componente que use `Router`/`RouterLink`/`ActivatedRoute` declara `provideRouter` (o dobles) en el `TestBed`; el test no debe depender del enrutador global.                                              |
| R-CP-6 | Probar los estados definidos en `R-UX-1`: carga, error y vacío, además del camino feliz.                                                                                                                       |
| R-CP-7 | Esperas con `await fixture.whenStable()` (o `vi.useFakeTimers` si hay `debounceTime`); prohibido `setTimeout`/`sleep` en el test (`R-FL-2`).                                                                   |
| R-CP-8 | Los formularios se prueban con entradas inválidas y válidas: mensajes de validación, bloqueo de submit y el payload emitido (`R-SE-6`).                                                                        |

## Verificación

```bash
npm test -- --include src/app/domains/**/*.spec.ts
grep -rn "querySelector('.\(bg-\|text-\|flex\)" src --include=*.spec.ts   # R-CP-2: vacío
```
