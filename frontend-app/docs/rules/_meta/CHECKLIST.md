# CHECKLIST — Revisión de PR

> Resumen ejecutable de [`rules/test/`](../test/README.md),
> [`rules/architecture/`](../architecture/README.md),
> [`rules/frontend/`](../frontend/README.md), [`rules/ui/`](../ui/README.md),
> [`rules/security/`](../security/README.md) y [`rules/git/`](../git/README.md).
> Copiar en la descripción del PR y marcar. Cada ítem remite a su regla.

## 1. Identificar tipo de cambio → capas obligatorias

Matriz completa en [`06-estandares-cobertura.md`](../test/06-estandares-cobertura.md). Marcar las capas ✅ que aplican:

| Tipo de cambio              | Unit puro           | Componentes      | Contrato            | E2E              |
| --------------------------- | ------------------- | ---------------- | ------------------- | ---------------- |
| Adapter / utilidad / modelo | ✅                  | —                | ✅ (si toca borde)  | —                |
| Store / servicio HTTP       | ✅                  | —                | ✅ (si consume API) | —                |
| Componente con lógica       | —                   | ✅               | —                   | —                |
| Formulario                  | ✅ (validación)     | ✅ (interacción) | —                   | ✅ (si es flujo) |
| Flujo de usuario nuevo      | ✅ (lo que aplique) | ✅               | —                   | ✅               |
| **Bug en producción**       | ✅ regression       | ✅ si es de UI   | si aplica           | si es visible    |
| Seguridad / sesión          | ✅                  | ✅               | —                   | ✅ (auth)        |

## 2. Universales (todo PR)

- [ ] **R0** — Los tests asientan el requisito, no la implementación (nada de "actualizar el expected para que pase").
- [ ] **R-U-2/R-U-3** — Nombres `debe <comportamiento> cuando <condición>`; un escenario por `it`.
- [ ] **R-FL-3** — Nada depende de la timezone de la máquina (`TZ` fija en Vitest).
- [ ] **R-COV-1** — La cobertura no baja respecto a `main` (cuando exista medición).
- [ ] **R-COV-2** — Todo archivo de lógica tocado tiene `*.spec.ts` (o excepción documentada).
- [ ] **R-GC-5** — Verificación del ámbito en verde antes del commit: `npx prettier --check .`, `npm run build` y `npm test`.

## 3. Arquitectura ([`architecture/`](../architecture/README.md))

- [ ] **R-AR-1** — El código vive en `domains/<feature>/` o `shared/`, con la carpeta correcta por tipo.
- [ ] **R-AR-2** — `shared/` no importa de `domains/`; el dominio vecino se consume por su API pública.
- [ ] **R-AR-3** — La infraestructura se consume por puerto + `InjectionToken` cableado en `app.config.ts`.
- [ ] **R-AR-4** — Las respuestas externas pasan por un adapter; el dominio no conoce `snake_case` ni envelopes.
- [ ] **R-AR-5** — El estado compartido vive en `signalStore`; derivados en `withComputed`.
- [ ] **R-AR-6** — Componentes standalone; rutas con `loadComponent`/`loadChildren`.
- [ ] **R-AR-7** — Formularios con `ReactiveFormsModule`; sin `ngModel` de negocio.
- [ ] **R-AR-8** — Sin `HttpClient` en componentes.
- [ ] **R-AR-9** — Errores traducidos y notificados; sin `alert`/`confirm`.
- [ ] **R-AR-10** — Suscripciones liberadas (`takeUntilDestroyed`/`async`).
- [ ] **R-AR-11** — Sin hosts/URLs hardcodeados; configuración en `environment`.

## 4. Nomenclatura ([`02-naming.md`](../architecture/02-naming.md))

- [ ] **R-NC-1/2** — Archivos `kebab-case` con sufijo por tipo y plantilla/estilos hermanos.
- [ ] **R-NC-4/5** — Clases `PascalCase`; selectores `app-*`.
- [ ] **R-NC-8** — Commit en Conventional Commits (remite a `R-GC-1`).
- [ ] **R-NC-9/10** — DTO `Backend...DTO` separado del modelo; sin `any`.
- [ ] **R-NC-11/12** — Claves `ecom_*`; rutas `kebab-case`.

## 5. Frontend / ingeniería ([`frontend/`](../frontend/README.md))

- [ ] **R-CX-1/2** — Capas y dependencia hacia dentro; la infraestructura por puerto/adaptador.
- [ ] **R-CX-3/4** — Lógica fuera de componentes; modelo de dominio puro.
- [ ] **R-CX-5/6** — Casos de uso con nombre de dominio; fronteras de feature respetadas.
- [ ] **R-SO-1/5/6** — SRP y DIP; presentacionales sin stores/servicios de dominio.
- [ ] **R-SH-1/3/4** — Qué va en `shared/` (≥2 consumidores); `shared/` no importa dominios.
- [ ] **R-LZ-1/2/3** — Rutas lazy; `@defer` con trigger y `@placeholder` para UI pesada.
- [ ] **R-HI-2/3/4** — Si hay SSR: hidratación incremental y código seguro para servidor. _(Hoy no aplica: sin SSR.)_
- [ ] **R-ST-1/3/4** — Una fuente de verdad; derivados en `withComputed`; mutaciones con `patchState`.
- [ ] **R-ST-5/6/7** — `rxMethod` para HTTP; alcance del store; persistencia en `withHooks`.
- [ ] **R-PF-1/2/3** — Build dentro de budgets; `NgOptimizedImage`; rutas lazy.
- [ ] **R-PF-4/6/7** — Sin trabajo pesado en plantilla; sin sondeo; zoneless (sin `zone.js`).

## 6. UI/UX ([`ui/`](../ui/README.md))

- [ ] **R-AC-1/2/3** — Nombre accesible, teclado y foco; modales con `role="dialog"` y cierre con Escape.
- [ ] **R-AC-4/5/6** — Imágenes con `alt`, contraste AA y `prefers-reduced-motion`.
- [ ] **R-UX-1** — Estados de carga/error/vacío definidos.
- [ ] **R-UX-3/5/6** — Dark mode, tokens de `tailwind.config.js` y `SeoService`.

## 7. Seguridad ([`security/01-seguridad.md`](../security/01-seguridad.md))

- [ ] **R-SE-1** — JWT en `Authorization: Bearer`; access token en memoria; refresh (si existe) persistido con justificación, rotativo y revocable.
- [ ] **R-SE-2/4** — Sin secretos en el bundle ni datos sensibles en consola.
- [ ] **R-SE-3** — Sin `bypassSecurityTrust*`/`innerHTML` con datos de usuario sin sanitizar.
- [ ] **R-SE-5** — `npm audit --audit-level=high` sin `high`/`critical`.
- [ ] **R-SE-9** — CSP estricta, terceros minimizados y tokens fuera de URLs/logs.

## 8. Unit y componentes

- [ ] **R-U-5/6/7** — Adapters probados con todos los shapes, fallback y tipos numéricos.
- [ ] **R-U-8/9/10** — Stores: transiciones, derivados boundary y `localStorage` aislado.
- [ ] **R-U-11/12/13** — Servicios con `HttpTestingController`; errores; guards/interceptors por rama.
- [ ] **R-CP-1/2/4** — Componentes con lógica: interacción, `data-testid` y dobles en `providers`.
- [ ] **R-CP-6/8** — Estados de carga/error/vacío y validación de formularios.

## 9. Contrato y E2E (cuando apliquen)

- [ ] **R-C-1/3** — Envelope del backend soportado; respuesta normalizada a modelo de dominio.
- [ ] **R-C-4** — Fechas ISO 8601 UTC; conversión local en UI.
- [ ] **R-C-8** — Fixture de contrato versionado en el repo.
- [ ] **R-E-9/11** — Cero errores de consola; selectores estables (`data-testid`).
- [ ] **R-E-12** — Suite hermética (fixtures/mocks, no backend de producción).

## 10. Si es bug (antes de todo lo anterior)

- [ ] **R-REG-1** — Primero el test que FALLA con el bug (rojo), luego la fix (verde); marcado `regression: <id>`.
- [ ] **R-REG-2** — El test de regresión asienta el requisito correcto (R0).
- [ ] **R-REG-3** — ¿Faltaba otra capa que lo hubiera detectado? Si sí, agregarla.

## 11. Antes de merge (CI)

- [ ] **G-1** unit + componentes en verde (`npm test`).
- [ ] **G-2** cobertura ≥ umbral (`R-COV-1`) — configurado en `angular.json`.
- [ ] **G-3** `npm run build` en verde (typecheck + budgets).
- [ ] **G-4** formato (`prettier --check .`).
- [ ] **G-5** lint (`eslint`) — configurado en `eslint.config.mjs`.
- [ ] **G-6** E2E de flujos (`npm run e2e`) — Playwright en CI.

## 12. Git — antes de subir ([`rules/git/`](../git/README.md))

- [ ] **R-GB-1/2** — Rama corta `tipo/...` desde `main`; nada commiteado directo a `main`.
- [ ] **R-GA-1/2/3** — Stage con rutas explícitas y revisado (`git diff --cached --stat`).
- [ ] **R-GA-4/5** — Ni artefactos ni secretos en el stage; sin `git add -f` injustificado.
- [ ] **R-GC-1/2/3/4** — Conventional Commits en español, unidad temática, ID de regla citado.
- [ ] **R-GC-7** — Sin `--amend`/rebase de commits ya publicados.
- [ ] **R-GP-1/7** — `git log origin/main..HEAD` leído: solo commits propios y previstos.
- [ ] **R-GP-3/4/5** — Sin force a `main`, sin WIP subido, `pull --rebase` si diverge.
- [ ] **R-PR-4/6/7** — Cuerpo con evidencia; checks verdes en la cabeza; merge `--rebase`.
- [ ] **R-PR-8** — Rama eliminada al cerrar.

> Estado actual de los gates: ver [`AUDIT.md`](./AUDIT.md) (snapshot).
