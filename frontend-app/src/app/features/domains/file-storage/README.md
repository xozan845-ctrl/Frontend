# domains/file-storage/ — Almacenamiento de archivos

Dominio de buckets, objetos, subidas prefirmadas, descargas y cuotas por tenant.
La página de administración vive en `features/applications/storage`.

- `models/`: contratos y helpers de presentación (`formatStorageBytes`).
- `adapters/`: normalización de respuestas de almacenamiento.
- `repositories/`: puerto `STORAGE_REPOSITORY`.
- `services/`: implementación HTTP y URLs públicas.
- `state/`: `StorageStore` para la página de almacenamiento.

Regla: los dominios consumen esta API pública directamente; no importan
`features/applications/storage`.
