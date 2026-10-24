import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthStore } from '../../state/auth/auth.store';
import { companyOwnerRedirectGuard } from './company-entry.guard';

describe('companyOwnerRedirectGuard', () => {
  const run = (store: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { createUrlTree: vi.fn(() => tree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() =>
      companyOwnerRedirectGuard({} as never, {} as never),
    );
    return { result, router, tree };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('redirige al workspace a un empresario con empresa activa', async () => {
    const { result, router, tree } = run({
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
    });

    expect(await result).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/empresa/inicio']);
  });

  it('permite completar el onboarding a un empresario sin tenant', async () => {
    const { result, router } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 'u-1', name: 'Eva', email: 'e@e.test', role: 'empresario' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('restaura la sesión antes de decidir la redirección', async () => {
    const refreshTokenOnce = vi.fn().mockImplementation(async () => true);
    const { result, router, tree } = run({
      isAuthenticated: () => false,
      user: () => ({
        id: 'u-1',
        name: 'Eva',
        email: 'e@e.test',
        role: 'empresario',
        tenantId: 'c-1',
      }),
      refreshToken: () => 'refresh-1',
      refreshTokenOnce,
    });

    expect(await result).toBe(tree);
    expect(refreshTokenOnce).toHaveBeenCalledOnce();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/empresa/inicio']);
  });
});
