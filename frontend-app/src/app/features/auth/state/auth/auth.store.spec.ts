import { TestBed } from '@angular/core/testing';
import { delay, of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthRepository, AUTH_REPOSITORY } from '../../repositories/auth.repository';

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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
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
    expect(repo.logout).toHaveBeenCalledWith('refresh-1');
    expect(store.refreshToken()).toBeNull();
    await vi.waitFor(() => expect(sessionStorage.getItem('ecom_refresh_token')).toBeNull());
  });

  it('clearSession limpia la sesión local sin llamar al backend', async () => {
    const store = setup();
    store.login({ email: 'ana@tienda.com', password: 'secreto1' });
    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));

    store.clearSession();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.refreshToken()).toBeNull();
    expect(repo.logout).not.toHaveBeenCalled();
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

    const renewed = await store.refreshTokenOnce();

    expect(renewed).toBe(false);
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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
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
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    await vi.waitFor(() => expect(store.token()).toBe('nuevo'));
    expect(store.refreshToken()).toBe('refresh-1');
  });

  it('refreshTokenOnce renueva la sesión y devuelve true', async () => {
    const store = setup();
    store.login({ email: 'ana@tienda.com', password: 'secreto1' });
    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));
    vi.mocked(repo.refresh).mockClear();

    const renewed = await store.refreshTokenOnce();

    expect(renewed).toBe(true);
    expect(repo.refresh).toHaveBeenCalledWith('refresh-1');
    expect(store.isAuthenticated()).toBe(true);
  });

  it('refreshTokenOnce devuelve false sin refresh token', async () => {
    const store = setup();

    const renewed = await store.refreshTokenOnce();

    expect(renewed).toBe(false);
    expect(repo.refresh).not.toHaveBeenCalled();
  });

  it('refreshTokenOnce limpia la sesión si la renovación falla', async () => {
    repo = {
      login: vi.fn(() => of(authResponse)),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => throwError(() => new Error('expirada'))),
      logout: vi.fn(() => of(true)),
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);
    store.login({ email: 'ana@tienda.com', password: 'secreto1' });
    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));

    const renewed = await store.refreshTokenOnce();

    expect(renewed).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('refreshTokenOnce deduplica renovaciones concurrentes (R-SE-1)', async () => {
    const store = setup();
    store.login({ email: 'ana@tienda.com', password: 'secreto1' });
    await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));
    vi.mocked(repo.refresh).mockClear();
    vi.mocked(repo.refresh).mockReturnValue(of(authResponse).pipe(delay(10)));

    const [first, second] = await Promise.all([store.refreshTokenOnce(), store.refreshTokenOnce()]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(repo.refresh).toHaveBeenCalledTimes(1);
  });

  it('debe usar el mensaje por defecto cuando el logout falla sin mensaje', async () => {
    repo = {
      login: vi.fn(() => of(authResponse)),
      register: vi.fn(() => of(authResponse)),
      refresh: vi.fn(() => of(authResponse)),
      logout: vi.fn(() => throwError(() => new Error(''))),
      me: vi.fn(() => of(authResponse.user)),
      resetPassword: vi.fn(() => of(true)),
      changePassword: vi.fn(() => of(true)),
      createUser: vi.fn(() => of(authResponse.user)),
      linkPersonal: vi.fn(() => of(true)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_REPOSITORY, useValue: repo }],
    });
    const store = TestBed.inject(AuthStore);

    store.logout();

    await vi.waitFor(() => expect(store.error()).toBe('Error al cerrar sesión'));
  });

  it('delega el alta administrativa de usuario en el repositorio', () => {
    const store = setup();

    store.createUser({
      name: 'Nuevo',
      email: 'nuevo@tienda.test',
      password: 'secreto123',
      role: 'comprador',
    });

    expect(repo.createUser).toHaveBeenCalledWith({
      name: 'Nuevo',
      email: 'nuevo@tienda.test',
      password: 'secreto123',
      role: 'comprador',
    });
  });

  it('delega la vinculación de personal en el repositorio', () => {
    const store = setup();

    store.linkPersonal({ personalId: 'personal-1', name: 'Nuevo' });

    expect(repo.linkPersonal).toHaveBeenCalledWith({
      personalId: 'personal-1',
      name: 'Nuevo',
    });
  });

  it('delega el perfil, el restablecimiento y el cambio de contraseña', () => {
    const store = setup();

    store.me().subscribe();
    store.requestPasswordReset('ana@tienda.test').subscribe();
    store.changePassword('actual123', 'nueva12345').subscribe();

    expect(repo.me).toHaveBeenCalled();
    expect(repo.resetPassword).toHaveBeenCalledWith('ana@tienda.test');
    expect(repo.changePassword).toHaveBeenCalledWith('actual123', 'nueva12345');
  });

  it('debe tolerar un fallo de sessionStorage al persistir el refresh token', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const store = setup();
      store.login({ email: 'ana@tienda.com', password: 'secreto1' });

      await vi.waitFor(() => expect(store.isAuthenticated()).toBe(true));
      await vi.waitFor(() =>
        expect(error).toHaveBeenCalledWith('Failed to persist refresh token', expect.any(Error)),
      );
    } finally {
      setItem.mockRestore();
      error.mockRestore();
    }
  });

  it('debe tolerar un fallo de localStorage al restaurar la sesión', () => {
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      setup();
      expect(error).toHaveBeenCalledWith('Failed to restore auth session', expect.any(Error));
    } finally {
      removeItem.mockRestore();
      error.mockRestore();
    }
  });
});
