# applications/storage/ — Página de almacenamiento

Página y ruta de administración del almacenamiento del tenant. El dominio
(bucket, objetos, subida, descarga y store) vive en
`features/domains/file-storage`.

- `pages/storage`: cuota, subida, búsqueda, descarga y borrado.
- `storage.routes.ts`: ruta lazy `almacenamiento` y providers del dominio.
