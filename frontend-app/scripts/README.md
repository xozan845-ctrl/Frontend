# scripts/ — Motor de gobernanza del frontend

Este directorio es el **mecanismo que mantiene el proyecto en su punto fijo**:
ejecuta de forma automática las reglas de [`docs/rules/`](../docs/rules/README.md)
que son verificables por máquina.

- **Reglas ejecutables:** job `Governance Rules` de CI
  (`.github/workflows/ci.yml`) y `npm run rules:check`.
- **Autotests del motor:** `npm run test:engine`.
- **Ancla normativa:** [`architecture/`](../docs/rules/architecture/README.md)
  (`R-AR`, `R-CX`, `R-NC`, `R-SO`, `R-ST`).
- **Decisión de arquitectura:** [ADR-12](../docs/decisiones.md).

> Principio rector: el motor de reglas **se aplica a sí mismo** los estándares
> del proyecto (tests propios, contrato explícito). Un validador que no se valida
> es una promesa, no una garantía.

## Qué vigila

| Suite                    | Reglas                                         | Qué comprueba                                                                                      |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `architecture-types`     | `R-NC-13`, `R-NC-9`, `R-CX-4`                  | Los tipos viven en archivos dedicados; no se mezclan con implementación.                           |
| `architecture-layers`    | `R-AR-2/3/8`, `R-CX-1/4/6`, `R-SO-8`, `R-ST-1` | Dirección de dependencias: `pages/components → state → services → adapters/repositories → models`. |
| `architecture-features`  | `R-AR-16`                                      | Contrato estructural por feature: capas, API pública y forma de páginas/componentes.               |
| `architecture-guards`    | `R-AR-7/9/10`                                  | Sin `ngModel`, diálogos nativos ni `subscribe` sin limpieza.                                       |
| `security-guards`        | `R-SE-3/4/7/9`                                 | Sin `innerHTML`/`console.log`, enlaces seguros y CSP presente.                                     |
| `performance-guards`     | `R-PF-6/7`                                     | Sin `setInterval`/`setTimeout` en features ni `zone.js`.                                           |
| `architecture-lifecycle` | `R-AR-15`                                      | Componentes/directivas sin `constructor` ni `ngOnInit`/`ngOnDestroy`; DI con `inject()`.           |
| `architecture-config`    | `R-AR-11`                                      | Sin URLs de API hardcodeadas ni `environment.apiUrl` en presentación.                              |
| `architecture-packaging` | `R-AR-14`                                      | Cada unidad lógica con ≥ 2 archivos vive en su subcarpeta `<unidad>/`; evita carpetas planas.      |
| `git-commits`            | `R-GC-1..4`, `R-GB-2`                          | Validador puro de asuntos (Conventional Commits) y nombres de rama.                                |
| `git-branch`             | `R-GC-1..4`, `R-GB-2`                          | Rama y commits reales del PR contra `origin/main`; se omite en `main`.                             |
| `docs-structure`         | `R-DO-6`                                       | Estructura de `docs/rules`, unicidad de IDs y enlaces internos.                                    |
| `docs-readmes`           | `R-DO-7`                                       | README.md en los directorios importantes (`REQUIRED_READMES`).                                     |
| `governance-coverage`    | `R-DO-9`                                       | Suites honestas (rules vs cites) y suelo de cobertura verificada.                                  |

> El contrato de capas por feature de `architecture-features` se declara en
> `FEATURE_CONTRACTS` y `FEATURE_ALLOWED_LAYERS` (`config/project.mjs`). Añadir,
> quitar o renombrar una capa exige actualizar el contrato y la documentación
> del feature en el mismo PR (`R-AR-16`).
> | `docs-sync` | `R-DO-8` | Si el PR cambia lógica/CI, exige actualizar la documentación necesaria; se omite en `main`. |

### Modelo de capas

Dentro de `features/<feature>/`:

```
pages/ · components/        presentación: consumen estado (stores); components puede usar puertos de infra (*.port.ts)
        │
        ▼
      state/                stores: orquestan el estado a partir de servicios/puertos
        │
        ▼
     services/              lógica de aplicación: implementan puertos, usan adapters
        │
        ▼
adapters/ · repositories/   infraestructura/puertos
        │
        ▼
      models/               dominio puro: sin Angular, sin HTTP, sin UI
```

Reglas concretas que impone `architecture-layers`:

- `models/` sólo importa `models/` (nada de Angular, rxjs ni otras capas).
- `repositories/` (puertos) sólo importa `models/`.
- `adapters/` sólo importa `models/` (y constantes de su feature).
- `services/` no importa `state/`, `pages/`, `components/` ni `guards/`.
- `state/` no importa `pages/`, `components/` ni `adapters/`.
- `pages/` no importa `services/`, `repositories/` ni `adapters/`, y no inyecta
  tokens `*_REPOSITORY`/`*_PORT` (aunque lleguen por `public-api`).
- `components/` (presentacionales) no importa ni inyecta stores, servicios de
  dominio, repositorios ni adapters; sí puede depender de un **puerto de
  infraestructura** (`*.port.ts`, p. ej. el API de Leaflet) por su abstracción.
- Otro feature sólo se importa por `public-api.ts` / `public-ui.ts`.
- `HttpClient` sólo se inyecta en `*.service.ts` o `interceptors/`.
- `core/` y `shared/` no importan `features/`; `layout/` sólo por `public-api.ts`/`public-ui.ts`.
- **Empaquetado por unidad** (`R-AR-14`): en `state/`, `services/`, `repositories/`,
  `adapters/`, `guards/`, `interceptors/` y `resolvers/`, una unidad con ≥ 2
  archivos vive en `<unidad>/` (p. ej. `state/ai-jobs/ai-jobs.store.ts`). Evita
  carpetas planas de N lógicas × M archivos.

## Arquitectura

Cuatro capas con dependencias en **un solo sentido**:

```
scripts/
├── README.md                 # este documento: contrato y mapa del motor
├── cli.mjs                   # ÚNICO entrypoint (composition root)
├── check-rules.mjs           # wrapper -> cli.mjs rules
│
├── engine/                   # infra reutilizable (CERO conocimiento del proyecto)
│   ├── runner.mjs            #   descubrimiento + manifiesto + ejecución
│   ├── suite.mjs             #   contrato defineSuite(...)
│   ├── report.mjs            #   plan de suites + cobertura de reglas
│   ├── runner.test.mjs       #   autotests del runner
│   ├── source.test.mjs       #   autotests del análisis estático
│   └── lib/
│       ├── paths.mjs         #   scriptsRoot, appRoot, repoRoot, resolveInApp()
│       ├── fs.mjs            #   walkFiles, readText, readJson
│       ├── source.mjs        #   máscara de comentarios/strings, imports, tipos, inject()
│       └── rules-docs.mjs    #   áreas, archivos NN-tema.md e IDs de docs/rules
│
├── config/                   # datos y política del proyecto
│   ├── project.mjs           #   capas, archivos de tipos, allowlists, rutas
│   ├── manifest.mjs          #   suites exigidas (id + archivo)
│   └── baseline.mjs          #   deuda arquitectónica aceptada (generado)
│
└── rules/                    # reglas ejecutables, agrupadas por dominio
    ├── architecture/
    │   ├── checks.mjs        #   chequeos puros (tipos, capas, configuración)
    │   ├── assertions.mjs    #   baseline + mensajes
    │   ├── types.test.mjs
    │   ├── layers.test.mjs
    │   └── config.test.mjs
    └── docs/structure.test.mjs
```

| Capa      | Puede importar de             | No puede importar de      |
| --------- | ----------------------------- | ------------------------- |
| `engine/` | Node built-ins                | `config/`, `rules/`       |
| `config/` | — (sólo datos)                | `engine/`, `rules/`       |
| `rules/`  | `engine/`, `config/`          | `engine` (salvo contrato) |
| `cli.mjs` | todo (es el composition root) | —                         |

## Contrato de una suite

```js
import { defineSuite } from '../../engine/suite.mjs';

export default defineSuite({
  id: 'architecture-types',
  area: 'architecture',
  rules: ['R-NC-13'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-NC-13: …', () => {
      /* assertions */
    });
  },
});
```

| Campo   | Para qué sirve                                                  |
| ------- | --------------------------------------------------------------- |
| `id`    | Identificador único de la suite (reporte y filtros).            |
| `area`  | Área de `docs/rules/` que vigila.                               |
| `rules` | IDs cubiertos → alimenta el **reporte de cobertura**.           |
| `mode`  | `pure` corre sin disco; `repo` inspecciona el repo real.        |
| `run`   | Registra los `test(...)`; recibe `{ test, assert }` inyectados. |

## Baseline de deuda

`config/baseline.mjs` contiene los hallazgos que **ya existían** al introducir el
motor. El check falla ante cualquier hallazgo **nuevo**; la deuda aceptada se
informa en cada ejecución (`ℹ N hallazgos en baseline`).

- Se regenera **conscientemente** con `npm run rules:baseline` (nunca para
  silenciar una violación nueva).
- Cada entrada se elimina al corregir el hallazgo.
- Las claves son estables: identifican el símbolo/import, no la línea.

## CLI

```
node scripts/cli.mjs rules [--only <id|area>] [--mode pure|repo] [--reporter spec|tap|dot|junit]
node scripts/cli.mjs baseline
```

| npm script       | Envuelve                        |
| ---------------- | ------------------------------- |
| `rules:check`    | `node scripts/cli.mjs rules`    |
| `rules:baseline` | `node scripts/cli.mjs baseline` |
| `test:engine`    | autotests del motor             |

El runner descubre las suites importándolas con el registro desactivado (lee
metadata sin ejecutar tests) y las lanza con `node --test` en un proceso nuevo
para evitar falsos verdes por caché ESM.

## Cómo añadir una regla ejecutable

1. Identifica el **dominio** y crea/edita su suite en `rules/<dominio>/`.
2. Declara la suite con `defineSuite` (incluye los IDs en `rules`).
3. Añade `{ id, file }` al `requiredSuites` de `config/manifest.mjs`.
4. Ejecuta `npm run rules:check` y `npm run test:engine` en verde.
5. La regla normativa sigue viviendo en `docs/rules/<area>/NN-tema.md`; el motor
   sólo la **verifica**. La regla y su check entran en el **mismo PR**.

## Estado

Cobertura verificada: **30/247 IDs** de regla con check real; hay **2
contextuales** (`R-AR-3`, `R-NC-9`) declaradas en `cites` porque hoy no tienen
check propio. `R-NC-10` (`any`) se verifica en ESLint
(`@typescript-eslint/no-explicit-any`). Las suites de git (`git-commits`,
`git-branch`) cubren `R-GC-1..4` y `R-GB-2`; `R-GA` (stage), `R-GP` (push) y
`R-PR` (PR) siguen siendo proceso y revisión manual. La deuda arquitectónica
aceptada está en **cero** (`config/baseline.mjs`). El gate `docs-sync` (`R-DO-8`)
exige documentación actualizada cuando un PR toca lógica, el motor o CI, y
`governance-coverage` (`R-DO-9`) impide que la cobertura baje de
`COVERAGE_MIN_VERIFIED`.
