# Reglas de Seguridad — frontend-ecomerce

Reglas que protegen al usuario y al negocio desde el frontend: manejo de la
**sesión**, sanitización contra XSS, **secretos**, dependencias y validación de
datos no confiables. El backend del e-commerce (Core Engine) tiene sus propias
reglas; aquí solo se cubre lo que decide este cliente.

## Archivos

| Archivo           | Contenido                                                                                                   | Sufijo       |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------ |
| `01-seguridad.md` | Token/sesión (JWT en cabeceras), almacenamiento, sanitización, secretos, dependencias, validación, terceros | `R-SE` (1–9) |

> Los derivados (AUDIT, CHECKLIST, historiales) viven en
> [`../_meta/`](../_meta/README.md).

## Mapa de IDs

| Prefijo  | Rango | Archivo           | Ámbito                |
| -------- | ----- | ----------------- | --------------------- |
| `R-SE-*` | 1–9   | `01-seguridad.md` | Seguridad del cliente |

## Reglas de otras áreas que exige esta (cross-refs)

| ID       | Exigencia                                                                               |
| -------- | --------------------------------------------------------------------------------------- |
| `R-SE-2` | Config pública por entorno → `R-AR-11` (`../architecture/01-arquitectura.md`)           |
| `R-SE-4` | Sin datos sensibles en consola → tests sin logs en `R-E-*` (`../test/03-reglas-e2e.md`) |
| `R-SE-5` | `npm audit` → security gate `R-QA-6` (`../test/07-qa-gates.md`)                         |
| `R-SE-6` | Validación → formularios `R-AR-7` y componentes `R-CP-*`                                |

## Pendientes

- Pendiente de auditar: entra en la próxima revisión (`R-COV-3`).
- Deuda conocida: el token se persiste en `localStorage` (`R-SE-1`); la meta es
  access token en memoria + refresh rotativo. Ver AUDIT y ADR-10.
