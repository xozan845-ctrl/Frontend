import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { fieldGuard } from './field.guard';
import { AuthStore } from '../../state/auth/auth.store';

describe('fieldGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/logistica/rutas' } as RouterStateSnapshot;

  const run = (store: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { createUrlTree: vi.fn(() => tree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => fieldGuard(route, state));
    return { result, router, tree };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe permitir los roles de logística de campo', async () => {
    for (const role of [
      'empresario',
      'vendedor',
      'logistica',
      'coordinador',
      'supervisor',
      'operativo',
      'empresa_logistica',
    ]) {
      const { result, router } = run({
        isAuthenticated: () => true,
        user: () => ({
          id: 1,
          name: 'U',
          email: 'u@tienda.test',
          role,
          tenantId: 'company-1',
          ...(role === 'vendedor' ? { storeId: 'store-1' } : {}),
          ...(role !== 'empresario' && role !== 'vendedor'
            ? { logisticsCompanyId: 'logistics-1' }
            : {}),
          ...(role === 'vendedor' ? { logisticsCompanyId: 'logistics-1' } : {}),
        }),
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
      user: () => ({
        id: 1,
        name: 'U',
        email: 'u@tienda.test',
        role: 'coordinador',
        logisticsCompanyId: 'logistics-1',
      }),
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
      queryParams: { returnUrl: '/logistica/rutas' },
    });
  });

  it('debe devolver al inicio a un rol sin acceso', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 1, name: 'C', email: 'c@tienda.test', role: 'comprador' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('debe rechazar la plataforma aunque tenga permisos administrativos', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 1, name: 'Root', email: 'root@tienda.test', role: 'super_admin' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
