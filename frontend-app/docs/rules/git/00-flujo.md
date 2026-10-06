# 00 — Flujo de ramas (trunk-based)

Modelo de ramas que sostiene el despliegue de [`../cd/`](../cd/README.md):
`main` es el **tronco** y todo el trabajo llega por ramas cortas y PRs.

| Etapa      | Rama                      | Dónde corre                        | Uso                                                      |
| ---------- | ------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Desarrollo | ramas `tipo/...` (cortas) | **local** (`npm start`)            | trabajo diario; nacen de `main` y mueren al mergear      |
| Producción | `main`                    | Dockploy, environment `produccion` | lo que se sirve a los clientes; solo recibe merges de PR |

| ID     | Regla                                                                                                                                                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-GB-1 | **Trunk-based con `main` protegida**: `main` es la única rama de larga vida y está protegida (sin push directo, sin force, PR obligatorio con checks en verde). `R-GB-4` prohíbe reescribir su historial.                                                                      |
| R-GB-2 | **Ramas cortas por trabajo**: cada cambio vive en una rama `tipo/ámbito-descripción` (`feat/checkout-cupon`, `fix/navbar-movil`, `docs/reglas-ui`) creada desde `main` (`git switch -c`). Debe durar pocos días; una rama que no se mergea se cierra o se rebasa sobre `main`. |
| R-GB-3 | **Releases por tag semver**: una release se marca con un tag `v<major>.<minor>.<patch>` (los scripts `npm run patch/minor/major` ya existen y hacen `npm version` + push de tags). Un tag publicado no se mueve ni se borra: un error se corrige con un tag nuevo.             |
| R-GB-4 | **Historial lineal**: se sincroniza con `git pull --rebase`; prohibido el merge de sincronización y prohibido reescribir `main` con force (`R-GP-3`).                                                                                                                          |
| R-GB-5 | **Sin ramas de entorno permanentes**: no hay `develop`/`staging` por defecto. Si se necesita un entorno de stage, se decide explícitamente en `decisiones.md` y se documenta en `cd/`, no se crea una rama de larga vida por conveniencia.                                     |
| R-GB-6 | **Hotfix de incidente**: un error en producción se corrige con una rama `fix/...` creada desde `main` y su PR a `main` (`R-PR-*`); nunca con un push directo ni un commit sobre `main` local.                                                                                  |
| R-GB-7 | **Higiene de ramas**: al mergear, la rama se elimina (local y `origin`); prohibido dejar ramas remotas sin PR abierto. Las ramas obsoletas (`cuba`, `hansmini`, `reestructura` de la herencia) se cierran o se documentan como históricas.                                     |

> La elección de trunk-based frente al modelo de tres entornos del proyecto
> heredado está registrada en [`../../decisiones.md`](../../decisiones.md) (ADR-01).
