import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { vendorGuard } from './vendor.guard';
import { AuthStore } from '../../../auth/public-api';

describe('vendorGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/vendedor/pedidos' } as RouterStateSnapshot;

  const run = (store: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { createUrlTree: vi.fn(() => tree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => vendorGuard(route, state));
    return { result, router, tree };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe permitir el acceso a una cuenta de vendedor', async () => {
    const { result, router } = run({
      isAuthenticated: () => true,
      user: () => ({
        id: 1,
        name: 'Vera',
        email: 'v@v.com',
        role: 'vendedor',
        tenantId: 'company-1',
        storeId: 'store-1',
      }),
      refreshToken: () => 'r',
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('debe mantener al empresario en su workspace de empresa', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 1, name: 'Eva', email: 'e@v.com', role: 'empresario' }),
      refreshToken: () => 'r',
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/empresa/inicio']);
  });

  it('debe restaurar la sesión con el refresh token antes de decidir', async () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(true);
    const { result } = run({
      isAuthenticated: () => false,
      user: () => ({
        id: 1,
        name: 'Vera',
        email: 'v@v.com',
        role: 'vendedor',
        tenantId: 'company-1',
        storeId: 'store-1',
      }),
      refreshToken: () => 'refresh-1',
      refreshTokenOnce,
    });

    expect(await result).toBe(true);
    expect(refreshTokenOnce).toHaveBeenCalled();
  });

  it('debe llevar al alta de tienda a un comprador autenticado', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 2, name: 'Cami', email: 'c@c.com', role: 'comprador' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/crear-tienda']);
  });

  it('debe redirigir a login al anónimo conservando la URL intentada', async () => {
    const refreshTokenOnce = vi.fn();
    const { result, router, tree } = run({
      isAuthenticated: () => false,
      user: () => null,
      refreshToken: () => null,
      refreshTokenOnce,
    });

    expect(await result).toBe(tree);
    expect(refreshTokenOnce).not.toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/vendedor/pedidos' },
    });
  });
});
