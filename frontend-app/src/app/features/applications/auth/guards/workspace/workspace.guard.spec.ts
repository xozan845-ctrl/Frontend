import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthStore } from '../../state/auth/auth.store';
import { workspaceGuard } from './workspace.guard';

describe('workspaceGuard', () => {
  const state = { url: '/logistica/dashboard' } as RouterStateSnapshot;

  const run = (store: Record<string, unknown>, data: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { createUrlTree: vi.fn(() => tree) };
    const route = { data } as ActivatedRouteSnapshot;
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => workspaceGuard(route, state));
    return { result, router, tree };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('permite logística al empresario con tenant', async () => {
    const { result, router } = run(
      {
        isAuthenticated: () => true,
        user: () => ({
          id: 'u-1',
          name: 'Eva',
          email: 'e@e.test',
          role: 'empresario',
          tenantId: 'c-1',
        }),
        refreshToken: () => null,
        refreshTokenOnce: vi.fn(),
      },
      { workspace: 'logistics' },
    );

    expect(await result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('rechaza logística al superadmin y lo deja en plataforma', async () => {
    const { result, router, tree } = run(
      {
        isAuthenticated: () => true,
        user: () => ({ id: 'u-1', name: 'Root', email: 'r@e.test', role: 'super_admin' }),
        refreshToken: () => null,
        refreshTokenOnce: vi.fn(),
      },
      { workspace: 'logistics' },
    );

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/inventario']);
  });

  it('exige el permiso explícito de roles de tienda', async () => {
    const { result, router, tree } = run(
      {
        isAuthenticated: () => true,
        user: () => ({
          id: 'u-1',
          name: 'Vera',
          email: 'v@e.test',
          role: 'vendedor',
          tenantId: 'c-1',
          permissions: ['store:read'],
        }),
        refreshToken: () => null,
        refreshTokenOnce: vi.fn(),
      },
      { workspace: 'store', permission: 'store:manage-roles' },
    );

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/vendedor/inicio']);
  });

  it('conserva la URL al enviar a login a un anónimo', async () => {
    const { result, router, tree } = run(
      {
        isAuthenticated: () => false,
        user: () => null,
        refreshToken: () => null,
        refreshTokenOnce: vi.fn(),
      },
      { workspace: 'company' },
    );

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/logistica/dashboard' },
    });
  });
});
