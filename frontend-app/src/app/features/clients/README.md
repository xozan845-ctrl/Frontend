# clients/ — Cartera de clientes compartida

Módulo de **clientes** reutilizado por el workspace de empresa y el panel del
vendedor. La UI, el store, el adaptador y el modal son únicos; cada workspace
inyecta su fuente de datos y su configuración visual.

| Capa            | Responsabilidad                                                       |
| --------------- | --------------------------------------------------------------------- |
| `models/`       | `Client`, `ClientOrder`, `ClientRecord`, KPIs y payloads.             |
| `adapters/`     | Agregación de órdenes, KPIs, filtros, CSV y saneo del registro local. |
| `repositories/` | Puerto `CLIENTS_DATA_SOURCE` (órdenes + clave de storage por ámbito). |
| `services/`     | Fuente HTTP compartida; el workspace configura endpoint y ámbito.     |
| `constants/`    | Paginación, umbrales, token de configuración y clave `ecom_*`.        |
| `state/`        | `ClientsStore` con derivados en `withComputed` y persistencia local.  |
| `components/`   | Modal de alta de cliente.                                             |
| `pages/`        | Página compartida; título, inicio e importación vienen por token.     |

## Decisión

Empresa y vendedor comparten el mismo módulo (ADR-56). El **estado** decide qué
se muestra: la fuente de datos entrega solo las órdenes del ámbito activo y la
configuración de ruta define título, miga de pan y capacidades. Empresa usa
`GET /orders/empresa` y storage por tenant; vendedor usa
`GET /orders/vendedor/mis-ventas` y storage por usuario. Los tokens ligeros de
configuración viven en `shared/clients/` para que las rutas eager no arrastren
el adaptador ni el store. Así no se duplica la lógica ni se hardcodean rutas o
roles dentro de la página.
