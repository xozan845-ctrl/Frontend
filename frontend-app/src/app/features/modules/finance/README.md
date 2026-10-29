# modules/finance/ — Centro financiero (Caja / Pagos)

Módulo de workspace que compone la pantalla de caja de la empresa sobre el
dominio y el store de `features/domains/finance`.

- `pages/finance`: saludo, KPIs, pestañas de sección y orquestación del store.
- `components/cash-kpi-grid`: tarjetas de saldo, ingresos, egresos y «otros».
- `components/cash-movements-panel`: libro de caja con periodo, búsqueda,
  paginación, saldo corrido y anulación de manuales.
- `components/payment-methods-panel`: métodos de pago y su uso.
- `components/cash-closures-panel`: arqueo y cierres diarios.
- `components/petty-cash-panel`: fondo fijo, reposiciones y gastos.
- `components/cash-banks-panel`: cuentas bancarias (`BanksStore`).
- `components/cash-transfers-panel`: transferencias entre caja y bancos.
- `components/*-modal`: alta de movimientos, métodos, cierres, caja chica,
  bancos, transferencias y reporte de caja.
- `finance.routes.ts`: ruta lazy de `/empresa/caja` con `FinanceStore`,
  `BanksStore` y `CompanySalesStore`; las ventas cobradas alimentan el libro.

Los registros manuales se persisten por tenant en `localStorage`; las ventas se
derivan en memoria y los totales viven en adaptadores y `withComputed`
(ADR-66, `R-ST-3`, `R-SO-8`).
