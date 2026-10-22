import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { logisticsGuard } from './logistics.guard';

describe('logisticsGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/logistica/dashboard' } as RouterStateSnapshot;

  const run = (store: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { createUrlTree: vi.fn(() => tree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => logisticsGuard(route, state));
    return { result, router, tree };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('permite la logística del empresario con tenant', async () => {
    const { result, router } = run({
      isAuthenticated: () => true,
      user: () => ({
        id: 'u-1',
        name: 'Eva',
        email: 'e@test.local',
        role: 'empresario',
        tenantId: 'c-1',
      }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('rechaza la logística global al superadmin', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 'u-1', name: 'Root', email: 'root@test.local', role: 'super_admin' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/inventario']);
  });

  it('conserva la URL para el login anónimo', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => false,
      user: () => null,
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/logistica/dashboard' },
    });
  });
});
