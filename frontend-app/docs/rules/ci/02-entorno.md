# 02 — Entorno y evidencia en CI

Aplica a: runner, dependencias y la evidencia que deja cada ejecución.

| ID     | Regla                                                                                                                                                                                                                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-EN-1 | **Entorno reproducible**: la versión de Node se fija en el workflow (LTS compatible con Angular 22 — hoy 20/22) y la usan todos los jobs, con cache de npm (`cache: npm`); instalación exclusivamente con `npm ci` — el `package-lock.json` es la fuente de verdad y `npm install` libre está prohibido en CI. |
| R-EN-2 | **Sin base de datos ni backend**: este repo es el frontend; los tests corren contra mocks y `HttpTestingController` (`R-QA-2`). Los jobs no levantan Postgres, RabbitMQ ni servicios vecinos.                                                                                                                  |
| R-EN-3 | **Evidencia en todos los runs**: el job de test sube el informe de cobertura como artifact en **todos** los runs (`if: always()`), verde o rojo, como evidencia de auditoría (`R-COV-3`). El estado del gate lo determina el resultado del job, nunca la presencia del artifact.                               |
| R-EN-4 | **Secretos**: si un job los necesita, viven únicamente en GitHub Secrets; prohibido imprimirlos en logs (`echo`, `set -x`) y prohibido commitearlos. Esta regla extiende `R-GA-4` a CI.                                                                                                                        |

## Notas

- La configuración pública del frontend (`environment.ts`) **no** es un secreto
  (`R-SE-2`); si un build necesita distintas URLs por entorno, se usan
  `fileReplacements` de `angular.json`, no variables secretas.
