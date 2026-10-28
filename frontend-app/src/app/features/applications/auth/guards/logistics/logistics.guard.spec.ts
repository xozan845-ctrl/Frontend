import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { logisticsGuard } from './logistics.guard';
import { AuthStore } from '../../state/auth/auth.store';

describe('logisticsGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/logistica/envios' } as RouterStateSnapshot;

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

  it('debe permitir admin, super_admin y empresario', async () => {
    for (const role of ['admin', 'super_admin', 'empresario']) {
      const { result, router } = run({
        isAuthenticated: () => true,
        user: () => ({ id: 1, name: 'U', email: 'u@tienda.test', role }),
        refreshToken: () => 'r',
        refreshTokenOnce: vi.fn(),
      });

      expect(await result).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalled();
      TestBed.resetTestingModule();
    }
  });

  it('debe restaurar la sesión antes de decidir', async () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(true);
    const { result } = run({
      isAuthenticated: () => false,
      user: () => ({ id: 1, name: 'U', email: 'u@tienda.test', role: 'empresario' }),
      refreshToken: () => 'refresh-1',
      refreshTokenOnce,
    });

    expect(await result).toBe(true);
    expect(refreshTokenOnce).toHaveBeenCalled();
  });

  it('debe llevar a login al anónimo', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => false,
      user: () => null,
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/logistica/envios' },
    });
  });

  it('debe devolver al inicio a un rol no autorizado', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 1, name: 'V', email: 'v@tienda.test', role: 'vendedor' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
