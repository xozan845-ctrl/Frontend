# finance/ — Dominio de compras, gastos y caja

Dominio local del workspace de empresa para el control financiero operativo.
Los registros se persisten por tenant en `localStorage` y se normalizan con
adaptadores tolerantes.

| Capa         | Responsabilidad                                                                |
| ------------ | ------------------------------------------------------------------------------ |
| `models/`    | Compras, gastos, libro de caja, métodos, cierres, caja chica y transferencias. |
| `constants/` | Tabs, categorías, métodos por defecto, periodos y claves de almacenamiento.    |
| `adapters/`  | Saneamiento/altas, saldo corrido, KPIs, filtros, cierres y reportes CSV/HTML.  |
| `state/`     | `FinanceStore`: colecciones, derivados, filtros, mutaciones y persistencia.    |

## Caja / Pagos

- `cash-movements.adapter.ts`: convierte ventas cobradas en movimientos, une el
  libro manual y calcula saldo corrido, filtros y KPIs.
- `cash-sections.adapter.ts`: métodos de pago, cierres diarios, caja chica y
  transferencias internas (incluidos sus movimientos de caja).
- `cash-report.adapter.ts`: reporte filtrado, CSV compatible con Excel y HTML
  imprimible para PDF.
- `FinanceStore` recibe las ventas mediante `setExternalCash`; no las persiste.
- Cada colección se guarda con `financeStorageKey(kind, tenantId)` para aislar
  los datos por empresa (`R-NC-11`).

El feature declara `kind: 'domain'` (ADR-66): no tiene páginas ni rutas. La
composición visual vive en `features/modules/finance`; el store se provee en la
ruta de caja junto con `BanksStore` y `CompanySalesStore`.
