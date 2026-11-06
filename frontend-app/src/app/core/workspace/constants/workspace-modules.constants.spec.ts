import type { Route, Routes } from '@angular/router';
import { ADMIN_ROUTES } from '../../../features/applications/admin/admin.routes';
import { COMPANY_WORKSPACE_ROUTE } from '../../../features/applications/empresas/empresas.routes';
import { LOGISTICA_ROUTES } from '../../../features/applications/logistica/logistica.routes';
import { VENDOR_ROUTES } from '../../../features/applications/vendor/vendor.routes';
import {
  WORKSPACE_MODULES,
  workspaceModuleById,
  workspaceModuleGroups,
} from './workspace-modules.constants';

/** Árbol de rutas del backoffice con los `loadChildren` ya resueltos. */
async function resolveRoutes(routes: Routes): Promise<Route[]> {
  const resolved: Route[] = [];

  for (const route of routes) {
    const children = await resolveRoutes(route.children ?? []);
    const lazyChildren = route.loadChildren
      ? await (route.loadChildren as () => Promise<Routes>)()
      : [];
    resolved.push({
      ...route,
      children: [...children, ...(await resolveRoutes(lazyChildren))],
    });
  }

  return resolved;
}

/** Comprueba si un path absoluto del registro casa con el árbol resuelto. */
function matchesUrl(routes: readonly Route[], segments: readonly string[]): boolean {
  return routes.some((route) => matchesRoute(route, segments));
}

function matchesRoute(route: Route, segments: readonly string[]): boolean {
  if (route.path === '**') return true;
  const parts = (route.path ?? '').split('/').filter(Boolean);

  if (parts.length === 0) {
    if (route.pathMatch === 'full' && segments.length > 0) return false;
    if (route.children && route.children.length > 0) {
      return matchesUrl(route.children, segments);
    }
    return segments.length === 0;
  }

  if (parts.length > segments.length) return false;

  const matched = parts.every((part, index) => {
    if (part === '**') return true;
    if (part.startsWith(':')) return Boolean(segments[index]);
    return part === segments[index];
  });
  if (!matched) return false;

  const rest = segments.slice(parts.length);
  if (route.children && route.children.length > 0) {
    return matchesUrl(route.children, rest);
  }
  return rest.length === 0;
}

async function workspaceRouteTree(): Promise<Route[]> {
  return resolveRoutes([
    COMPANY_WORKSPACE_ROUTE,
    { path: 'tienda', children: VENDOR_ROUTES },
    { path: 'admin', children: ADMIN_ROUTES },
    { path: 'logistica', children: LOGISTICA_ROUTES },
  ]);
}

describe('workspace-modules.constants', () => {
  it('debe agrupar operación, administración y footer de empresa', () => {
    const groups = workspaceModuleGroups('company', () => true);

    expect(groups.map((group) => group.section)).toEqual(['operacion', 'administracion', 'footer']);
    expect(groups[0].label).toBe('Operación');
    expect(groups[1].label).toBe('Administración');
    expect(groups[2].label).toBe('');
    expect(groups[0].items.map((item) => item.label)).toContain('Ventas');
    expect(groups[1].items.map((item) => item.label)).toContain('Vendedores');
  });

  it('debe separar los módulos de tienda de los de empresa', () => {
    const companyIds = workspaceModuleGroups('company', () => true).flatMap((group) =>
      group.items.map((item) => item.id),
    );
    const storeIds = workspaceModuleGroups('store', () => true).flatMap((group) =>
      group.items.map((item) => item.id),
    );

    expect(companyIds).toContain('company.sales');
    expect(companyIds).not.toContain('store.sales');
    expect(storeIds).toContain('store.sales');
    expect(storeIds).not.toContain('company.sales');
  });

  it('debe respetar el predicado de visibilidad', () => {
    const groups = workspaceModuleGroups('company', (module) => !module.permission);
    const ids = groups.flatMap((group) => group.items.map((item) => item.id));

    expect(ids).toEqual([]);
  });

  it('debe resolver un módulo por id', () => {
    expect(workspaceModuleById('company.sales')?.label).toBe('Ventas');
    expect(workspaceModuleById('no.existe')).toBeUndefined();
  });

  it('debe incluir plataforma y logística', () => {
    const platformIds = workspaceModuleGroups('platform', () => true).flatMap((group) =>
      group.items.map((item) => item.id),
    );
    const logisticsIds = workspaceModuleGroups('logistics', () => true).flatMap((group) =>
      group.items.map((item) => item.id),
    );
    const storeIds = workspaceModuleGroups('store', () => true).flatMap((group) =>
      group.items.map((item) => item.id),
    );

    expect(platformIds).toContain('platform.inventory');
    expect(logisticsIds).toContain('logistics.dashboard');
    expect(storeIds).toContain('store.billing');
  });

  it('debe mantener ids y testIds únicos', () => {
    const ids = WORKSPACE_MODULES.map((module) => module.id);
    const testIds = WORKSPACE_MODULES.map((module) => module.testId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(testIds).size).toBe(testIds.length);
    expect(testIds.every((testId) => testId.length > 0)).toBe(true);
  });

  it('todos los links del registro resuelven a una ruta canónica /app', async () => {
    const tree = await workspaceRouteTree();
    const broken = WORKSPACE_MODULES.filter((module) => {
      const segments = module.link
        .replace(/^\/app\/?/, '')
        .split('/')
        .filter(Boolean);
      return !module.link.startsWith('/app/') || !matchesUrl(tree, segments);
    }).map((module) => `${module.id} -> ${module.link}`);

    expect(broken).toEqual([]);
  });
});
