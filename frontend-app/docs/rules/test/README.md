# Reglas de Testing — frontend-ecomerce

Reglas que **toda** prueba de la SPA debe cumplir. El principio rector se hereda
del proyecto origen (donde un test validaba la implementación bugueada en vez del
requisito) y se mantiene: **el test valida el requisito, no la implementación**.

El stack de pruebas es **Vitest** con `@angular/build:unit-test` y **Angular
TestBed**. Las capas de esta área es el estándar exigible; el estado vigente
(22 archivos / 110 tests) y las deudas están en
[`../_meta/AUDIT.md`](../_meta/AUDIT.md).

## Archivos

| Archivo                      | Contenido                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `01-reglas-unit.md`          | Unit puro: adapters, utilidades, stores, servicios HTTP, guards/interceptors |
| `02-reglas-componentes.md`   | Componentes con TestBed (formularios, eventos, inputs, outputs)              |
| `03-reglas-e2e.md`           | E2E de flujos críticos en navegador real (Playwright, cuando exista)         |
| `04-reglas-contrato.md`      | Contrato con el API del backend (shapes, envelopes, fechas)                  |
| `05-reglas-robustez.md`      | Regression-first, robustez de entradas y anti-flakiness                      |
| `06-estandares-cobertura.md` | Matriz de capas, umbrales de cobertura y gates de CI (`G-*`)                 |
| `07-qa-gates.md`             | Política global de QA y security gate (`R-QA`)                               |

> Los documentos derivados (**CHECKLIST, AUDIT, AUDIT-HISTORY**) no viven aquí:
> están en [`../_meta/`](../_meta/README.md). Un área de reglas solo contiene
> `README.md` + archivos `NN-tema.md`.

## Mapa de IDs

| Prefijo   | Rango | Archivo                      | Ámbito                     |
| --------- | ----- | ---------------------------- | -------------------------- |
| `R0`      | —     | `README.md`                  | Principio rector           |
| `R-U-*`   | 1–14  | `01-reglas-unit.md`          | Unit puro                  |
| `R-CP-*`  | 1–8   | `02-reglas-componentes.md`   | Componentes con TestBed    |
| `R-E-*`   | 1–14  | `03-reglas-e2e.md`           | E2E                        |
| `R-C-*`   | 1–8   | `04-reglas-contrato.md`      | Contrato con el backend    |
| `R-REG-*` | 1–3   | `05-reglas-robustez.md`      | Regression-first           |
| `R-RB-*`  | 1–4   | `05-reglas-robustez.md`      | Robustez de entradas       |
| `R-FL-*`  | 1–4   | `05-reglas-robustez.md`      | Anti-flakiness             |
| `G-*`     | 1–6   | `06-estandares-cobertura.md` | Gates de CI                |
| `R-COV-*` | 1–4   | `06-estandares-cobertura.md` | Cobertura y anti-regresión |
| `R-QA-*`  | 1–6   | `07-qa-gates.md`             | Política global de QA      |

> La mecánica de CI (gatillos, concurrencia, runner, evidencia) vive en
> [`../ci/`](../ci/README.md) — aquí solo los gates `G-*` y sus reglas.
> Las reglas que los tests protegen (adapters tolerantes, estado, seguridad)
> viven en [`../architecture/`](../architecture/README.md),
> [`../security/`](../security/README.md) y [`../ui/`](../ui/README.md).

## Principio rector

> **R0 — El test valida el REQUISITO, no la implementación.**
> Si el requisito es "el catálogo muestra solo productos de la categoría
> seleccionada", el test asienta esa semántica, no lo que el código produce hoy.
> Un test que pasa con la implementación bugueada es un test inválido.

## Convenciones (mantener el "punto fijo")

1. **Formato de ID:** `R-<SUFIJO>-<n>` secuencial e incremental dentro del
   archivo. Un sufijo pertenece a **un solo archivo**. Los gates de CI usan
   `G-<n>`. Nunca reutilizar ni renumerar IDs.
2. **Formato de regla:** tabla `| ID | Regla |`; imperativo, concreto y
   verificable en un PR.
3. **Archivos:** numeración `NN-tema.md` con título `# NN — Tema`.
4. **Referencias cruzadas:** siempre con el ID completo (`R-U-8`), jamás "la
   regla 8". Antes de renombrar/eliminar: `grep -rn "R-XX-n" docs/rules/`.
5. **Agregar una regla:** añadir en su archivo → actualizar el **Mapa de IDs** →
   reflejarla en [`../_meta/CHECKLIST.md`](../_meta/CHECKLIST.md) si afecta
   revisión → re-auditar (`R-COV-3`).
6. **Estado ≠ regla:** las reglas son permanentes; el cumplimiento vive en
   [`../_meta/AUDIT.md`](../_meta/AUDIT.md) y
   [`../_meta/AUDIT-HISTORY.md`](../_meta/AUDIT-HISTORY.md).

## Ciclo de vida

1. Toda historia/bug incluye sus pruebas en la capa correspondiente (§ matriz en
   `06-estandares-cobertura.md`).
2. Todo bug nuevo: **primero** el test que falla, luego la fix
   (`05-reglas-robustez.md`, `R-REG-1`).
3. La auditoría se re-ejecuta antes de cada release: se reescribe
   [`../_meta/AUDIT.md`](../_meta/AUDIT.md) y se agrega una entrada al final de
   [`../_meta/AUDIT-HISTORY.md`](../_meta/AUDIT-HISTORY.md).

## Cómo ejecutar y auditar (este repo)

```bash
npm test                       # suite unit + componentes (Vitest vía Angular)
npm test -- --coverage         # con cobertura (cuando R-COV-4 esté configurado)
npm run build                  # G-3: compilación + typecheck + budgets
npx prettier --check .         # G-4: formato
npx eslint .                   # G-5: lint
npm audit --audit-level=high   # R-QA-6: security gate
```

## Pendientes (deuda abierta)

El estado vigente vive en [`../_meta/AUDIT.md`](../_meta/AUDIT.md) (`R-COV-3`).
Deudas abiertas destacadas:

- **Cobertura crítica**: el umbral global pasa, pero `auth.store`/`auth.service`
  y `product.service` siguen por debajo del 80 % de líneas/ramas (`R-QA-1`).
- **Capa de componentes**: formularios y componentes con lógica (`checkout`,
  `product-detail`, `search-autocomplete`, `cart-sidebar`, …) sin spec (`R-CP-1`).
- **Capa de contrato**: sin fixtures de respuesta del backend versionados
  (`R-C-8`).
