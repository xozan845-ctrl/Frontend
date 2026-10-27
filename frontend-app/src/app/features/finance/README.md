# finance/ — Dominio de compras, gastos y caja

Dominio local del workspace de empresa para el control financiero operativo.
Los registros se persisten por tenant en `localStorage` y se normalizan con un
adaptador tolerante.

| Capa         | Responsabilidad                                                         |
| ------------ | ----------------------------------------------------------------------- |
| `models/`    | Compras, gastos, movimientos de caja, payloads y resumen financiero.    |
| `constants/` | Tabs, estados, categorías, formas de pago y claves de almacenamiento.   |
| `adapters/`  | Creación y saneamiento de registros; totales y saldo de caja.           |
| `state/`     | `FinanceStore`: listas, resumen, altas/bajas y persistencia por tenant. |

El feature es `domainOnly` (ADR-66): no tiene páginas ni rutas. La composición
visual vive en `features/modules/finance`; el store se provee en cada ruta del
módulo y comparte el dominio entre Compras, Gastos y Caja.
