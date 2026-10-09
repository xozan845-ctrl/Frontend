import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStore } from '../state/auth.store';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/tienda/x/checkout' } as RouterStateSnapshot;

  const run = (store: Record<string, unknown>) => {
    const router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    return { result, router };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe permitir el acceso cuando hay sesión activa', async () => {
    const { result, router } = run({
      isAuthenticated: () => true,
      refreshToken: () => 'r',
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('debe restaurar la sesión con el refresh token antes de decidir', async () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(true);
    const { result, router } = run({
      isAuthenticated: () => false,
      refreshToken: () => 'refresh-1',
      refreshTokenOnce,
    });

    expect(await result).toBe(true);
    expect(refreshTokenOnce).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('debe denegar y redirigir a login cuando no hay sesión ni refresh token', async () => {
    const refreshTokenOnce = vi.fn();
    const { result, router } = run({
      isAuthenticated: () => false,
      refreshToken: () => null,
      refreshTokenOnce,
    });

    expect(await result).toBe(false);
    expect(refreshTokenOnce).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/tienda/x/checkout' },
    });
  });
});
