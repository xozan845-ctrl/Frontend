import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { companyGuard } from './company.guard';

describe('companyGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/empresa/inicio' } as RouterStateSnapshot;

  const run = (store: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { createUrlTree: vi.fn(() => tree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => companyGuard(route, state));
    return { result, router, tree };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('permite al propietario de empresa', async () => {
    const { result, router } = run({
      isAuthenticated: () => true,
      user: () => ({
        id: 'u-1',
        name: 'Eva',
        email: 'e@e.test',
        role: 'empresario',
        tenantId: 'company-1',
      }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('envía al vendedor a su panel operativo', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 'u-2', name: 'Vera', email: 'v@v.test', role: 'vendedor' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/vendedor/inicio']);
  });

  it('conserva la URL al llevar a un anónimo al login', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => false,
      user: () => null,
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/empresa/inicio' },
    });
  });
});
