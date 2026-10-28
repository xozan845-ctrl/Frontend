# modules/barcodes/ — Composición de Códigos de barras

Módulo compartido por empresa y vendedor. La página recibe la configuración del
workspace (`BARCODES_SCOPE_CONFIG`) y compone KPIs, formulario y tabla.

- `pages/barcodes`: etiquetas registradas, alta con generación opcional y
  borrado.
- `components/barcode-form`: alta presentacional con simbología y copias.
- `barcodes.routes.ts`: ruta lazy y `BarcodesStore`; el scope lo provee el
  workspace padre.

El dominio y el store viven en `features/barcodes`; el módulo no duplica estado
(ADR-69).
