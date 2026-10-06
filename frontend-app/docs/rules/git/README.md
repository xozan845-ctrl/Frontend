# Reglas de Git — frontend-ecomerce

Reglas que **todo** cambio versionado debe cumplir antes de llegar a `origin`:
cómo se arma el stage, cómo se narra el commit, cómo se publica y **por dónde
entra el trabajo** (PR con checks). Un historial limpio es infraestructura: los
commits son la documentación viva de por qué existe cada línea.

## Archivos

| Archivo         | Contenido                                                                                      | Sufijo       |
| --------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| `00-flujo.md`   | Modelo **trunk-based**: `main` protegida, ramas cortas, tags semver, hotfix e higiene de ramas | `R-GB` (1–7) |
| `01-stage.md`   | `git add`: stage explícito, atómico, sin artefactos ni secretos                                | `R-GA` (1–5) |
| `02-commits.md` | `git commit`: Conventional Commits, unidad temática, verificación pre-commit                   | `R-GC` (1–7) |
| `03-push.md`    | `git push`: qué subir, force-push, divergencia y verificación post-push                        | `R-GP` (1–7) |
| `04-pr.md`      | `gh pr`: rama por trabajo, cuerpo con evidencia, checks en la cabeza y merge `--rebase`        | `R-PR` (1–8) |

> Los documentos derivados (**CHECKLIST, AUDIT, AUDIT-HISTORY**) no viven aquí:
> están en [`../_meta/`](../_meta/README.md). Un área de reglas solo contiene
> `README.md` + archivos `NN-tema.md`.

## Mapa de IDs

| Prefijo  | Rango | Archivo         | Ámbito                                    |
| -------- | ----- | --------------- | ----------------------------------------- |
| `R-GB-*` | 1–7   | `00-flujo.md`   | Ramas, releases por tag y hotfix          |
| `R-GA-*` | 1–5   | `01-stage.md`   | Stage (`git add`)                         |
| `R-GC-*` | 1–7   | `02-commits.md` | Commit (`git commit -m`)                  |
| `R-GP-*` | 1–7   | `03-push.md`    | Push (`git push`)                         |
| `R-PR-*` | 1–8   | `04-pr.md`      | PR (`gh pr`): rama, cuerpo, checks, merge |

## Principio rector

> **Un push es una declaración profesional.** Antes de que un commit llegue a
> `origin` debe poder resumirse en una frase (`R-GC-3`), haberse armado con stage
> explícito (`R-GA-1`) y pasar la verificación de su ámbito (`R-GC-5`).
>
> **Y una rama es una unidad revisable.** `main` no recibe trabajo escrito a
> mano: lo recibe de un PR con evidencia en el cuerpo (`R-PR-4`), checks verdes
> en su cabeza (`R-PR-6`) y merge por rebase (`R-PR-7`).

## Convenciones (mantener el "punto fijo")

1. **Formato de ID:** `R-<SUFIJO>-<n>` secuencial. Un sufijo pertenece a un solo
   archivo. Nunca renumerar ni reutilizar IDs existentes.
2. **Formato de regla:** tabla `| ID | Regla |`, imperativo y verificable en un PR.
3. **Archivos:** `NN-tema.md` con título `# NN — Tema`.
4. **Referencias cruzadas:** siempre con el ID completo (`R-GC-5`), jamás "la
   regla 5". Antes de renombrar/eliminar: `grep -rn "R-GC-n" docs/rules/`.
5. **Agregar una regla:** en su archivo → actualizar el **Mapa de IDs** → reflejar
   en [`../_meta/CHECKLIST.md`](../_meta/CHECKLIST.md) → re-auditar (`R-COV-3`).
6. **Estado ≠ regla:** el cumplimiento vive en
   [`../_meta/AUDIT.md`](../_meta/AUDIT.md).

## Cómo verificar (comandos)

```bash
# stage revisado: solo los archivos del cambio
git status --short && git diff --cached --stat

# qué se va a subir exactamente (debe coincidir con lo previsto)
git log origin/main..HEAD --oneline

# asuntos conformes a Conventional Commits (debe imprimir vacío)
git log origin/main..HEAD --pretty=%s \
  | grep -vE '^(feat|fix|docs|test|refactor|perf|style|ci|build|chore)(\([a-z-]+\))?: .+'

# verificación del ámbito antes del commit
npx prettier --check .
npm run build

# main lineal (R-GB-4): debe imprimir 0
git rev-list --merges --count origin/main
```
