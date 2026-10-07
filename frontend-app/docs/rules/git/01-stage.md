# 01 — Stage: `git add`

| ID     | Regla                                                                                                                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-GA-1 | Armar el stage con rutas explícitas (`git add src/app/features/cart/…`); prohibido `git add .`, `git add -A` y `git commit -a` como método de trabajo: el stage se compone a mano, no se barre.      |
| R-GA-2 | Antes de commitear, revisar el stage con `git status --short` y `git diff --cached --stat`: si aparece un archivo ajeno al cambio, sacarlo con `git restore --staged <ruta>`.                        |
| R-GA-3 | Stage atómico: contiene exactamente los archivos que narra el commit (un cambio = un stage = un commit); el trabajo incompleto queda fuera.                                                          |
| R-GA-4 | Jamás stagear artefactos ni secretos: `node_modules/`, `dist/`, `.angular/`, `coverage/`, `*.log`, `.env*`, claves, tokens. Si `git status` los muestra, corregir `.gitignore` **antes** de stagear. |
| R-GA-5 | Prohibido `git add -f` sobre archivos ignorados; solo se admite si es fuente que debe versionarse y la excepción se justifica en el PR.                                                              |

## Verificación

```bash
git status --short              # nada ajeno al cambio
git diff --cached --stat        # el listado coincide con el commit planeado
git diff --cached | grep -iE "api[_-]?key|secret|password|token"   # vacío
```
