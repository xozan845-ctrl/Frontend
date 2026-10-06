# 01 — Build y artefacto de release

Reglas del artefacto que se despliega: cómo se construye la SPA y qué no puede
llevar dentro.

| ID     | Regla                                                                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CD-1 | **Build reproducible**: el artefacto se genera con `npm ci` + `npm run build` (configuración `production`, salida en `dist/frontend-app/browser`). Prohibido desplegar un build de desarrollo (`ng serve`, `--configuration development`) en producción. |
| R-CD-2 | **Cero secretos en el bundle**: ninguna credencial/clave entra en el artefacto; `environment.prod.ts` solo lleva configuración pública (`R-SE-2`). Recordar que **todo** lo que llega al navegador es público.                                           |
| R-CD-3 | **Versionado por tag**: una release se identifica con el tag semver (`R-GB-3`) y su commit debe estar en `main` con el build en verde. Un tag publicado no se mueve.                                                                                     |
| R-CD-4 | **Mismo artefacto para todos los entornos**: si hay más de un entorno, se despliega **el mismo build**; las diferencias de URL/config se resuelven en el build de cada entorno o en runtime, nunca reconstruyendo "a mano" en el servidor.               |
| R-CD-5 | **Rollback = artefacto anterior**: revertir un despliegue es volver a desplegar la versión previa conocida, no editar archivos en el servidor. Toda release debe poder revertirse a la inmediatamente anterior.                                          |

## Verificación

```bash
npm run build
ls dist/frontend-app/browser/index.html                 # artefacto listo
grep -riE "api[_-]?key|secret|password" dist/frontend-app/browser   # R-CD-2: vacío
```
