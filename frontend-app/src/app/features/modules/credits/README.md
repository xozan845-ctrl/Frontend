# modules/credits/ — Composición de Créditos

Módulo compartido por empresa y vendedor. La página recibe la configuración del
workspace (`CREDITS_SCOPE_CONFIG`) y compone KPIs, formulario y tabla.

- `pages/credits`: pendiente, vencido, cobrado, activos, alta, pago y borrado.
- `components/credit-form`: alta presentacional con vencimiento e importe.
- `credits.routes.ts`: ruta lazy y `CreditsStore`; el scope lo provee el
  workspace padre.

El dominio y el store viven en `features/domains/credits`; el módulo no duplica estado
(ADR-70).
