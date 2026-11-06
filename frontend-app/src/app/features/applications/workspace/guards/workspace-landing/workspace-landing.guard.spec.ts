import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { workspaceLandingGuard } from './workspace-landing.guard';

describe('workspaceLandingGuard', () => {
  const run = (store: Record<string, unknown>) => {
    const tree = {} as UrlTree;
    const router = { parseUrl: vi.fn(() => tree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    return {
      result: TestBed.runInInjectionContext(() => workspaceLandingGuard({} as never, {} as never)),
      router,
      tree,
    };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe resolver el contexto de empresa', async () => {
    const { result, router, tree } = run({
      isAuthenticated: () => true,
      user: () => ({ id: 'u-1', name: 'Eva', email: 'eva@test.local', role: 'empresario' }),
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    expect(await result).toBe(tree);
    expect(router.parseUrl).toHaveBeenCalledWith('/app/empresa/inicio');
  });

  it('debe resolver el contexto de tienda, plataforma y logística', async () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [
        {
          id: 'u-2',
          name: 'Vera',
          email: 'v@test.local',
          role: 'vendedor',
          tenantId: 'c-1',
          storeId: 's-1',
        },
        '/app/tienda/inicio',
      ],
      [
        { id: 'u-3', name: 'Root', email: 'r@test.local', role: 'super_admin' },
        '/app/admin/inventario',
      ],
      [
        {
          id: 'u-4',
          name: 'Log',
          email: 'l@test.local',
          role: 'empresa_logistica',
          logisticsCompanyId: 'log-1',
          logisticsCompanyRole: 'owner',
        },
        '/app/logistica/dashboard',
      ],
    ];

    for (const [user, landing] of cases) {
      const { result, router } = run({
        isAuthenticated: () => true,
        user: () => user,
        refreshToken: () => null,
        refreshTokenOnce: vi.fn(),
      });

      await result;
      expect(router.parseUrl).toHaveBeenCalledWith(landing);
      TestBed.resetTestingModule();
    }
  });

  it('debe enviar al login si no hay sesión', async () => {
    const { result, router } = run({
      isAuthenticated: () => false,
      user: () => null,
      refreshToken: () => null,
      refreshTokenOnce: vi.fn(),
    });

    await result;
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
  });
});
