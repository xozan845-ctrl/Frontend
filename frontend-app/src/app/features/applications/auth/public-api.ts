/**
 * API pública del feature `auth`: páginas, guards e interceptores. La sesión y
 * las reglas de autorización viven en `features/domains/session` y se reexportan
 * aquí para los consumidores que ya usaban esta API.
 */
export * from '../../domains/session/public-api';
export { adminGuard, isAdminRole } from './guards/admin/admin.guard';
export { canViewShipments, logisticsGuard } from './guards/logistics/logistics.guard';
export { canViewField, fieldGuard } from './guards/field/field.guard';
export { workspaceGuard } from './guards/workspace/workspace.guard';
export { companyOwnerRedirectGuard } from './guards/company-entry/company-entry.guard';
export { moduleGuard } from './guards/module/module.guard';
