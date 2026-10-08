import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStore } from '../state/auth.store';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/tienda/x/checkout' } as RouterStateSnapshot;

  const run = (isAuthenticated: boolean) => {
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { isAuthenticated: () => isAuthenticated } },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    return { result, router };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe permitir el acceso cuando hay sesión activa', () => {
    const { result, router } = run(true);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('debe denegar el acceso y redirigir a login cuando no hay sesión', () => {
    const { result, router } = run(false);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/tienda/x/checkout' },
    });
  });
});
