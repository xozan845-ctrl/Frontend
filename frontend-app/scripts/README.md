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

| Suite                 | Reglas                                         | Qué comprueba                                                                                      |
| --------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `architecture-types`  | `R-NC-13`, `R-NC-9`, `R-CX-4`                  | Los tipos viven en archivos dedicados; no se mezclan con implementación.                           |
| `architecture-layers` | `R-AR-2/3/8`, `R-CX-1/4/6`, `R-SO-8`, `R-ST-1` | Dirección de dependencias: `pages/components → state → services → adapters/repositories → models`. |
| `architecture-config` | `R-AR-11`                                      | Sin URLs de API hardcodeadas ni `environment.apiUrl` en presentación.                              |
| `docs-structure`      | `R-DO-1/2`                                     | Manifiesto de suites, estructura de `docs/rules`, unicidad de IDs y enlaces.                       |

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

Cobertura ejecutable: **13/239 IDs** de regla con check. La deuda arquitectónica
aceptada vive en `config/baseline.mjs` (46 tipos + 18 dependencias + 3 URLs) y se
quema de forma incremental; no se añaden entradas para ocultar violaciones nuevas.
