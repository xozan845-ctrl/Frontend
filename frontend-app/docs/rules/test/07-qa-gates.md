# 07 — Reglas Doradas de Pruebas y QA

Aplica a: cobertura como gate, independencia de las suites, edge cases,
aislamiento y la puerta de seguridad del pipeline. Complementa
[`01-reglas-unit.md`](./01-reglas-unit.md)…
[`06-estandares-cobertura.md`](./06-estandares-cobertura.md) sin repetirlas: aquí
vive lo que el pipeline exige **como política global**.

## Reglas

| ID     | Regla                                                                                                                                                                                                                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-QA-1 | **Cobertura mínima de CI**: la cobertura debe estar configurada con un umbral aplicado automáticamente. Para la lógica crítica (adapters/contrato con el backend, stores de carrito/auth, servicios HTTP) el mínimo es **80 % de líneas y ramas**. El pipeline falla si se viola (`R-COV-1`, `G-2`). |
| R-QA-2 | **Unit tests independientes**: las pruebas unitarias y de componentes **jamás** se conectan a la red ni al backend real; usan mocks, `useValue`/`useClass` y `HttpTestingController`. Corren en milisegundos y de forma determinista.                                                                |
| R-QA-3 | **Integración y E2E son las únicas con red real**: los E2E (`R-E-*`) pueden golpear un backend de prueba o mocks persistentes, pero deben ejecutarse en un entorno limpio y no dejar estado residual entre tests (aislamiento, `R-E-12`).                                                            |
| R-QA-4 | **Edge cases obligatorios**: además del happy path, se prueban errores: respuesta de API malformada, `null`/campos faltantes, timeout, 401/403/404/409/500, carrito vacío, cupón inválido y sesión expirada, validando respuesta _graceful_.                                                         |
| R-QA-5 | **Aislamiento de tests**: cada `it(...)` es independiente; no se arrastra estado global, `localStorage` ni variables estáticas entre pruebas.                                                                                                                                                        |
| R-QA-6 | **Security gate**: el pipeline debe incluir `npm audit --audit-level=high` como paso obligatorio previo al despliegue; con vulnerabilidades `high`/`critical` sin resolver, el pipeline falla. Aplica `R-SE-5` de forma automática.                                                                  |

## Notas

- `R-QA-6` no es un gate `G-*` ([`06-estandares-cobertura.md`](./06-estandares-cobertura.md)):
  es política de seguridad. El job `security-gate` de
  [`.github/workflows/ci.yml`](../../../../.github/workflows/ci.yml) la ejecuta en
  todo PR y en push a `main`; la verificación local antes de cada release sigue
  siendo obligatoria (`R-GC-5`).
- La evidencia del PR es la salida real del comando con su ID de regla, no la
  afirmación de que "los checks pasan" (`R-PR-4`). Para `G-1`/`G-2` se registra
  el número de archivos y tests junto a los umbrales vigentes; para `G-6`, el
  número de flujos Playwright y el resultado de axe (`R-E-25`).
