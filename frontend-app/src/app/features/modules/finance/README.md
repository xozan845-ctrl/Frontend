# modules/finance/ — Composición de Compras, Gastos y Caja

Módulo de workspace que compone las tres vistas financieras de la empresa
sobre el dominio y el store de `features/finance`.

- `pages/finance`: cabecera, KPIs, pestañas y orquestación del store.
- `components/purchase-panel`: alta y listado de compras.
- `components/expense-panel`: alta y listado de gastos.
- `components/cash-panel`: alta, listado y saldo de caja.
- `finance.routes.ts`: una ruta lazy por sección (`compras`, `gastos`, `caja`)
  con el `FinanceStore` provisto y la pestaña en `data.tab`.

Los registros se persisten por tenant en `localStorage`; el dominio, el
adaptador y el store viven en `features/finance` y se consumen por su API
pública (ADR-66).
