import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthRepository, AUTH_REPOSITORY } from '../repositories/auth.repository';

const authResponse = {
  user: { id: 1, email: 'ana@tienda.com', name: 'Ana' },
  token: 'jwt-token',
  refreshToken: 'refresh-1',
};

describe('AuthStore', () => {
  let repo: AuthRepository;

  const setup = () => {
    repo = {
      login: vi.fn(() => of(authResponse)),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => of(authResponse)),
      logout: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    return TestBed.inject(AuthStore);
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('debe iniciar sin sesión', () => {
    const store = TestBed.inject(AuthStore);

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(store.refreshToken()).toBeNull();
  });

  it('debe autenticar al usuario tras el login', async () => {
    const store = setup();

    store.login({ email: 'ana@tienda.com', password: 'secreto1' });

    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));
    expect(store.user()?.name).toBe('Ana');
    expect(store.token()).toBe('jwt-token');
  });

  it('debe persistir SOLO el refresh token en sessionStorage (R-SE-1)', async () => {
    const store = setup();

    store.login({ email: 'ana@tienda.com', password: 'secreto1' });

    await vi.waitFor(() => expect(sessionStorage.getItem('ecom_refresh_token')).toBe('refresh-1'));
    expect(localStorage.getItem('ecom_auth_data')).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain('jwt-token');
  });

  it('debe purgar un access token heredado en localStorage al iniciar', () => {
    localStorage.setItem('ecom_auth_data', JSON.stringify(authResponse));

    const store = setup();

    expect(localStorage.getItem('ecom_auth_data')).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('debe restaurar la sesión renovando con el refresh token persistido', async () => {
    sessionStorage.setItem('ecom_refresh_token', 'refresh-1');

    const store = setup();

    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));
    expect(repo.refresh).toHaveBeenCalledWith('refresh-1');
  });

  it('debe cerrar la sesión y limpiar el refresh token en logout', async () => {
    const store = setup();
    store.login({ email: 'ana@tienda.com', password: 'secreto1' });
    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));

    store.logout();

    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(false));
    expect(store.refreshToken()).toBeNull();
    await vi.waitFor(() => expect(sessionStorage.getItem('ecom_refresh_token')).toBeNull());
  });

  it('debe limpiar el error', () => {
    const store = TestBed.inject(AuthStore);

    store.clearError();

    expect(store.error()).toBeNull();
  });
});
