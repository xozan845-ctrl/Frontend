/**
 * API pública del feature `storage`: página y rutas de almacenamiento. El
 * dominio (modelos, puerto, servicio y store) vive en
 * `features/domains/file-storage` y se reexporta aquí.
 */
export * from '../../domains/file-storage/public-api';
export { STORAGE_ROUTES } from './storage.routes';
