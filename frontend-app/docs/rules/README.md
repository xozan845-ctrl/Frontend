# rules/ — Reglas del proyecto (punto fijo)

Este directorio define las reglas **permanentes** de `frontend-ecomerce`: el punto
fijo al que no se desvía ninguna decisión técnica. Las reglas no cambian por
conveniencia de un PR; cambian por decisión explícita y quedan registradas aquí.

> **Origen:** el formato de esta carpeta se heredó de un proyecto backend (Core
> Engine) donde funcionó bien; el **contenido se reescribió por completo** para
> este repo, que es una **SPA Angular 22** (NgRx Signals + Tailwind + Vitest). Lo
> que se conserva es la mecánica: áreas con `README.md` + `NN-tema.md`, IDs
> inmutables, reglas verificables en un PR y derivados (auditorías, checklist)
> separados en `_meta/`.

## Estructura

```
rules/
├── README.md           ← este índice: áreas, estado, convenciones globales
│
├── architecture/       ✅ activa — capas core/shared/layout/features, DI/puertos, adapters, estado, naming (R-AR/R-NC)
├── frontend/           ✅ activa — clean/hexagonal, SOLID/SRP + Smart/Dumb, shared, lazy, hidratación, signal store y rendimiento (R-CX/R-SO/R-SH/R-LZ/R-HI/R-ST/R-PF)
├── ui/                 ✅ activa (sin auditar) — accesibilidad y experiencia (R-AC/R-UX)
├── security/           ✅ activa (sin auditar) — sesión/token, XSS, secretos y dependencias (R-SE)
│
├── test/               ✅ activa — unit, componentes, E2E, contrato, robustez, cobertura, QA (R-U/…/R-QA, G-*)
├── git/                ✅ activa (sin auditar) — trunk-based: ramas, stage, commits, push y PR (R-GB/R-GA/R-GC/R-GP/R-PR)
├── ci/                 ✅ activa (contrato, sin workflow) — integración continua (R-CI/R-EN)
├── cd/                 ✅ activa (contrato, sin pipeline) — despliegue en Dockploy (R-CD)
├── ai/                 ✅ activa (nueva) — reglas para contribuciones de IA (R-IA)
├── documentation/      ✅ activa (nueva) — documentación como código (R-DO)
│
└── _meta/              ⚠️ documentos DERIVADOS — nunca normativos
    ├── CHECKLIST.md        herramienta de revisión de PR
    ├── AUDIT.md            snapshot del estado (se reescribe por auditoría)
    └── AUDIT-HISTORY.md    log append-only de auditorías
```

**Regla de estructura (la más importante de esta carpeta):**

> Un **área** (`architecture/`, `frontend/`, `ui/`, `security/`, `test/`, `git/`,
> `ci/`, `cd/`, `ai/`, `documentation/`) solo contiene `README.md` + archivos de
> reglas `NN-tema.md`. Todo documento derivado (audit, checklist, log, estado)
> vive en `_meta/` y jamás dentro de un área.

## Áreas

| Área             | Estado                                | Índice                                                 | Contenido                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `architecture/`  | ✅ **activa**                         | [`architecture/README.md`](./architecture/README.md)   | Capas `core/shared/layout/features` (ADR-12), dirección de dependencias, puertos + `InjectionToken` (DIP), adapters/ACL, estado con NgRx Signals, rutas por feature, formularios reactivos, naming Angular (IDs `R-AR/R-NC`) |
| `frontend/`      | ✅ **activa**                         | [`frontend/README.md`](./frontend/README.md)           | Ingeniería Angular: clean/hexagonal (`R-CX`), SOLID/SRP y **Smart/Dumb** (`R-SO`), código compartido (`R-SH`), carga diferida (`R-LZ`), hidratación incremental (`R-HI`), signal store (`R-ST`) y rendimiento (`R-PF`)       |
| `ui/`            | ✅ **activa** (sin auditar)           | [`ui/README.md`](./ui/README.md)                       | Presentación: accesibilidad (`R-AC`) y experiencia/diseño — estados, responsive, dark mode, design tokens, SEO/PWA (`R-UX`)                                                                                                  |
| `security/`      | ✅ **activa** (sin auditar)           | [`security/README.md`](./security/README.md)           | Sesión y almacenamiento, sanitización/XSS, secretos y configuración pública, dependencias, validación de entrada (IDs `R-SE`)                                                                                                |
| `test/`          | ✅ **activa** ⚠️ cobertura incipiente | [`test/README.md`](./test/README.md)                   | Reglas de testing: unit puro, componentes, E2E, contrato, robustez, cobertura y QA gates (IDs `R-U/R-CP/R-E/R-C/…/G-*`)                                                                                                      |
| `git/`           | ✅ **activa** (sin auditar)           | [`git/README.md`](./git/README.md)                     | Flujo **trunk-based**: `main` protegida, ramas cortas, tags semver, `git add`, `git commit -m`, `git push` y `gh pr` (IDs `R-GB/R-GA/R-GC/R-GP/R-PR`)                                                                        |
| `ci/`            | ✅ **activa** (implementada)          | [`ci/README.md`](./ci/README.md)                       | CI: gatillos push/PR, concurrencia, entorno y evidencia. Implementada en `.github/workflows/ci.yml` (6 jobs) (IDs `R-CI/R-EN`)                                                                                               |
| `cd/`            | ✅ **activa** (contrato)              | [`cd/README.md`](./cd/README.md)                       | Despliegue del frontend en **Dockploy** (mismo VPS que Core Engine): build estático, environment `produccion`, smoke y rollback (IDs `R-CD`)                                                                                 |
| `ai/`            | ✅ **activa** (nueva)                 | [`ai/README.md`](./ai/README.md)                       | Reglas obligatorias para IAs: contexto, atomicidad, uso de tools y apego al workflow (IDs `R-IA`)                                                                                                                            |
| `documentation/` | ✅ **activa** (nueva)                 | [`documentation/README.md`](./documentation/README.md) | Documentación como código: READMEs, ADRs, variables de entorno y comentarios (IDs `R-DO`)                                                                                                                                    |
| `_meta/`         | ⚠️ **no normativo**                   | [`_meta/README.md`](./_meta/README.md)                 | Derivados: checklist, snapshots de auditoría, histórico                                                                                                                                                                      |

## Convenciones globales (aplican a todas las áreas)

1. **Archivos:** `README.md` (índice del área + mapa de IDs + pendientes) y reglas
   en archivos `NN-tema.md` con título `# NN — Tema`. Nunca más de un tema por archivo.
2. **IDs de regla:** `R-<SUFIJO>-<n>` secuencial e incremental, un sufijo por
   archivo. Gates de CI: `G-<n>`. Un ID = una regla, para siempre (nunca
   renumerar ni reutilizar).
3. **Formato de regla:** tabla `| ID | Regla |`, redacción en imperativo y
   verificable en un PR. Si no se puede comprobar, no es una regla.
4. **Referencias:** siempre por ID completo (`R-AR-3`), nunca por número suelto.
   Las referencias entre áreas incluyen la ruta (`R-AR-4` en
   `../architecture/01-arquitectura.md`).
5. **Regla ≠ estado:** la regla dice _qué_; `_meta/AUDIT.md` dice _qué tan
   cumplida está_. En cada auditoría se reescribe el snapshot y se agrega una
   entrada al histórico.
6. **Referencias cruzadas:** `grep -rn "R-XX-n" docs/rules/` antes de
   renombrar/eliminar.

El área `test/` es el ejemplo canónico al que apuntan las demás.

## Estado actual (resumen)

El repo tiene **51 archivos / 254 tests**, cobertura global 94/92/95/94, CI en
**6 jobs** (`.github/workflows/ci.yml`), ESLint + Prettier, suite **E2E de 8
flujos** (Playwright) y pipeline de despliegue (Docker + nginx + CSP). La
**estructura enterprise** (`core/ · shared/ · layout/ · features/`) está
**aceptada (ADR-12) y en migración**; el estado vigente y las deudas abiertas
viven en [`_meta/AUDIT.md`](./_meta/AUDIT.md) (`R-COV-3`); aquí solo se describe
el punto fijo.

## Decisión de flujo

El flujo elegido es **trunk-based** (`main` protegida + ramas cortas + tags
semver), no el modelo de tres entornos del backend heredado; el despliegue se
hace en **Dockploy** (mismo VPS que Core Engine). La estructura de código se rige
por **ADR-12** (`core/shared/layout/features` + Smart/Dumb). Las decisiones viven
en [`../decisiones.md`](../decisiones.md) (ADR-01, ADR-02, ADR-12).
