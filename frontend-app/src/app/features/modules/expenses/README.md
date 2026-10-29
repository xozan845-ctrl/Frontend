# modules/expenses/ — Composición de Gastos

Módulo de la pantalla de Gastos de empresa sobre el dominio `features/domains/expenses`.

- `pages/expenses`: saludo, KPIs, tabs, filtros, tabla/paginación y acciones.
- `components/expense-modal`: alta/edición de gasto y categoría personalizada.
- `components/expense-report-modal`: filtros de reporte y exportación Excel/PDF.
- `expenses.routes.ts`: ruta lazy y `ExpensesStore`.

El dominio, adaptador y store viven en `features/domains/expenses`; el módulo solo
compone la experiencia (ADR-72).
