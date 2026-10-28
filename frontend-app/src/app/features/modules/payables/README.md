# modules/payables/ — Composición de Cuentas por pagar

Módulo compartido por empresa y vendedor. La página recibe la configuración del
workspace (`PAYABLES_SCOPE_CONFIG`) y compone KPIs, formulario y tabla.

- `pages/payables`: cabecera, KPIs, alta y listado con pago/borrado.
- `components/payable-form`: alta presentacional de una cuenta.
- `payables.routes.ts`: ruta lazy y `PayablesStore`; el scope lo provee el
  workspace padre.

El dominio y el store viven en `features/domains/payables`; el módulo no duplica estado
(ADR-67).
