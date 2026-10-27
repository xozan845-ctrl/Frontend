import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { moduleGuard } from './module.guard';
import { AuthStore } from '../../state/auth/auth.store';
import type { User } from '../../models/auth.model';

const user = signal<User | null>(null);
const refreshToken = signal<string | null>(null);
const refreshTokenOnce = vi.fn();
const authStore = {
  user: user.asReadonly(),
  isAuthenticated: () => !!user(),
  refreshToken: refreshToken.asReadonly(),
  refreshTokenOnce,
};

const owner: User = {
  id: 'u-1',
  email: 'owner@empresa.com',
  name: 'Owner',
  role: 'empresario',
  tenantId: 'empresa-1',
} as User;
const seller: User = {
  id: 'u-2',
  email: 'seller@tienda.com',
  name: 'Seller',
  role: 'vendedor',
  tenantId: 'empresa-1',
  storeId: 'tienda-1',
} as User;

describe('moduleGuard', () => {
  const router = { createUrlTree: vi.fn((commands, extras) => ({ commands, extras })) };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    });
  };

  const run = (moduleId: string) =>
    TestBed.runInInjectionContext(() =>
      moduleGuard(moduleId)({} as never, { url: '/destino' } as never),
    );

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    user.set(null);
    refreshToken.set(null);
  });

  it('debe permitir un módulo de empresa al propietario', async () => {
    user.set(owner);
    setup();

    await expect(run('company.sales')).resolves.toBe(true);
  });

  it('debe permitir un módulo de tienda al vendedor', async () => {
    user.set(seller);
    setup();

    await expect(run('store.sales')).resolves.toBe(true);
  });

  it('debe redirigir al workspace correcto cuando el módulo es de otro ámbito', async () => {
    user.set(seller);
    setup();

    await expect(run('company.sales')).resolves.toEqual({ commands: ['/vendedor/inicio'] });
  });

  it('debe respetar los permisos delegados del vendedor', async () => {
    user.set({ ...seller, permissions: ['store:read'] } as User);
    setup();

    await expect(run('store.reports')).resolves.toEqual({ commands: ['/vendedor/inicio'] });
  });

  it('debe redirigir al login sin sesión', async () => {
    setup();

    await expect(run('company.sales')).resolves.toEqual({
      commands: ['/login'],
      extras: { queryParams: { returnUrl: '/destino' } },
    });
  });

  it('debe intentar restaurar la sesión antes de decidir', async () => {
    refreshToken.set('refresh');
    setup();
    refreshTokenOnce.mockImplementation(async () => {
      user.set(owner);
      return true;
    });

    await expect(run('company.sales')).resolves.toBe(true);
    expect(refreshTokenOnce).toHaveBeenCalled();
  });

  it('debe fallar cerrado si el módulo no existe', async () => {
    user.set(owner);
    setup();

    await expect(run('no.existe')).resolves.toEqual({ commands: ['/empresa/inicio'] });
  });
});
