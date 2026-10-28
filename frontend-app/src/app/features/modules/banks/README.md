# modules/banks/ — Composición de Bancos

Módulo compartido por empresa y vendedor. La página recibe la configuración del
workspace (`BANKS_SCOPE_CONFIG`) y compone KPIs, formulario de alta/edición y
tabla de cuentas.

- `pages/banks`: saldo total, cuentas, edición y borrado.
- `components/bank-form`: alta/edición presentacional.
- `banks.routes.ts`: ruta lazy y `BanksStore`; el scope lo provee el workspace
  padre.

El dominio y el store viven en `features/domains/banks`; el módulo no duplica estado
(ADR-68).
