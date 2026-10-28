import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthStore } from '../../state/auth/auth.store';

describe('adminGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/admin/inventario' } as RouterStateSnapshot;

  const run = (store: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { createUrlTree: vi.fn(() => tree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => adminGuard(route, state));
    return { result, router, tree };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe permitir el acceso a admin y super_admin', async () => {
    for (const role of ['admin', 'super_admin']) {
      const { result, router } = run({
        isAuthenticated: () => true,
        user: () => ({ id: 1, name: 'Admin', email: 'admin@tienda.test', role }),
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
      user: () => ({ id: 1, name: 'Admin', email: 'admin@tienda.test', role: 'admin' }),
      refreshToken: () => 'refresh-1',
      refreshTokenOnce,
    });

    expect(await result).toBe(true);
    expect(refreshTokenOnce).toHaveBeenCalled();
  });

  it('debe llevar a login al anónimo conservando la URL', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => false,
      user: () => null,
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/admin/inventario' },
    });
  });

  it('debe devolver al inicio a un rol que no es admin', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 2, name: 'Vera', email: 'vera@tienda.test', role: 'vendedor' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
