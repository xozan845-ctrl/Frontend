import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
    const store = setup();

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
    const store = setup();

    store.clearError();

    expect(store.error()).toBeNull();
  });

  it('debe registrar y autenticar al usuario', async () => {
    const store = setup();

    store.register({ name: 'Nuevo', email: 'nuevo@tienda.com', password: 'secreto1' });

    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));
    expect(repo.register).toHaveBeenCalled();
  });

  it('no debe renovar cuando no hay refresh token en memoria', async () => {
    const store = setup();

    store.refreshSession();

    await vi.waitFor(() => expect(store.loading()).toBe(false));
    expect(repo.refresh).not.toHaveBeenCalled();
  });

  // regression: R-RB-3 — un error de login no debe matar el `rxMethod`.
  it('debe permitir reintentar el login tras un error', async () => {
    let shouldFail = true;
    repo = {
      login: vi.fn(() => (shouldFail ? throwError(() => new Error('boom')) : of(authResponse))),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => of(authResponse)),
      logout: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    store.login({ email: 'ana@tienda.com', password: 'secreto1' });
    await vi.waitFor(() => expect(store.error()).not.toBeNull());

    shouldFail = false;
    store.login({ email: 'ana@tienda.com', password: 'secreto1' });
    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));
  });

  it('debe registrar el error de registro', async () => {
    repo = {
      login: vi.fn(() => of(authResponse)),
      register: vi.fn(() => throwError(() => new Error('email duplicado'))),
      refresh: vi.fn(() => of(authResponse)),
      logout: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    store.register({ name: 'Ana', email: 'ana@tienda.com', password: 'secreto1' });

    await vi.waitFor(() => expect(store.error()).toBe('email duplicado'));
  });

  it('debe usar un mensaje por defecto cuando el error no trae mensaje', async () => {
    repo = {
      login: vi.fn(() => throwError(() => new Error(''))),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => of(authResponse)),
      logout: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    store.login({ email: 'ana@tienda.com', password: 'secreto1' });

    await vi.waitFor(() => expect(store.error()).toBe('Error al iniciar sesión'));
  });

  it('debe limpiar la sesión cuando la renovación falla', async () => {
    sessionStorage.setItem('ecom_refresh_token', 'refresh-1');
    repo = {
      login: vi.fn(() => of(authResponse)),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => throwError(() => new Error('sesión expirada'))),
      logout: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    await vi.waitFor(() => expect(store.refreshToken()).toBeNull());
    expect(store.error()).toContain('sesión expirada');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('debe registrar el error de logout', async () => {
    repo = {
      login: vi.fn(() => of(authResponse)),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => of(authResponse)),
      logout: vi.fn(() => throwError(() => new Error('sin conexión'))),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    store.logout();

    await vi.waitFor(() => expect(store.error()).toBe('sin conexión'));
    expect(store.user()).toBeNull();
  });

  it('debe quedar sin tokens cuando la respuesta no los trae', async () => {
    repo = {
      login: vi.fn(() => of({ user: authResponse.user })),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => of(authResponse)),
      logout: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    store.login({ email: 'ana@tienda.com', password: 'secreto1' });

    await vi.waitFor(() => expect(store.user()).not.toBeNull());
    expect(store.token()).toBeNull();
    expect(store.refreshToken()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('debe conservar el refresh token cuando la renovación no devuelve uno nuevo', async () => {
    sessionStorage.setItem('ecom_refresh_token', 'refresh-1');
    repo = {
      login: vi.fn(() => of(authResponse)),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => of({ user: authResponse.user, token: 'nuevo' })),
      logout: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    await vi.waitFor(() => expect(store.token()).toBe('nuevo'));
    expect(store.refreshToken()).toBe('refresh-1');
  });
});
