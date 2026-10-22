import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import {
  AuthResponse,
  CreateUserData,
  LinkPersonalData,
  LoginCredentials,
  RegisterData,
  User,
} from '../../models/auth.model';
import {
  adaptAuthResponseFromBackend,
  adaptUserFromBackend,
} from '../../adapters/auth/auth.adapter';
import { AuthRepository } from '../../repositories/auth.repository';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly authEndpoint = environment.apiConfig?.endpoints?.auth || '/auth';
  private readonly apiUrl = `${environment.apiUrl}${this.authEndpoint}`;

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return this.mockLogin(credentials);
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .post<unknown>(`${this.apiUrl}/login`, {
        correo: credentials.email,
        contrasena: credentials.password,
      })
      .pipe(
        map((res) => adaptAuthResponseFromBackend(res, credentials.email)),
        catchError((error) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo iniciar sesión.'))),
        ),
      );
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return this.mockRegister(userData);
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .post<unknown>(`${this.apiUrl}/registro`, {
        nombre: userData.name,
        correo: userData.email,
        contrasena: userData.password,
        // El contrato de Core Engine solo admite `empresario` o `comprador`
        // en el alta pública (ADR-26). La cuenta de facturador es una cuenta
        // de empresario hasta que exista un rol propio (ADR-24).
        rol: userData.role === 'seller' || userData.role === 'biller' ? 'empresario' : 'comprador',
      })
      .pipe(
        map((res) => adaptAuthResponseFromBackend(res, userData.email)),
        catchError((error) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo registrar la cuenta.'))),
        ),
      );
  }

  /**
   * Cierra sesión. Envía el `refresh_token` para revocar **solo esta** sesión
   * (Core Engine revoca todas si se omite). Exige un access token válido; el
   * interceptor lo renueva y reintenta si expiró.
   */
  logout(refreshToken?: string): Observable<boolean> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of(true).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.post<unknown>(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).pipe(
      map(() => true),
      catchError((error) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cerrar sesión.'))),
      ),
    );
  }

  /** Perfil de la sesión actual (`GET /auth/me` → `{user_id,email,rol}`). */
  me(): Observable<User> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of({ id: 'mock-user', email: 'mock@tienda.com', name: 'Mock' }).pipe(delay(150));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.get<unknown>(`${this.apiUrl}/me`).pipe(
      map((res) => adaptUserFromBackend(res)),
      catchError((error) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar tu perfil.'))),
      ),
    );
  }

  /**
   * Solicita el restablecimiento de contraseña por correo. El backend responde
   * `{ ok: true }` siempre (no revela si el correo existe, OWASP A07).
   */
  resetPassword(email: string): Observable<boolean> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of(true).pipe(delay(300));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.post<unknown>(`${this.apiUrl}/restablecer-contrasena`, { correo: email }).pipe(
      map(() => true),
      catchError((error) =>
        throwError(
          () => new Error(toUserMessage(error, 'No se pudo solicitar el restablecimiento.')),
        ),
      ),
    );
  }

  /**
   * Cambia la contraseña autenticada. Core Engine invalida las sesiones
   * abiertas al cambiarla, así que el llamador debe limpiar la sesión local.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of(true).pipe(delay(300));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .post<unknown>(`${this.apiUrl}/cambiar-contrasena`, {
        actual: currentPassword,
        nueva: newPassword,
      })
      .pipe(
        map(() => true),
        catchError((error) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo cambiar la contraseña.'))),
        ),
      );
  }

  /**
   * Alta administrativa de usuario (`POST /auth/crear-usuario`). Core Engine
   * solo la permite a un administrador y exige `tenantId` para los roles de
   * logística.
   */
  createUser(userData: CreateUserData): Observable<User> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of({
        id: `mock-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        tenantId: userData.tenantId,
        personalId: userData.personalId,
      }).pipe(delay(300));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .post<unknown>(`${this.apiUrl}/crear-usuario`, {
        nombre: userData.name,
        correo: userData.email,
        contrasena: userData.password,
        rol: userData.role,
        tenant_id: userData.tenantId,
        personal_id: userData.personalId,
      })
      .pipe(
        map((res) => adaptUserFromBackend(res, userData.email)),
        catchError((error) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear el usuario.'))),
        ),
      );
  }

  /**
   * Vincula la ficha de personal del usuario autenticado
   * (`POST /auth/vincular-personal`) y, opcionalmente, actualiza su nombre.
   */
  linkPersonal(data: LinkPersonalData): Observable<boolean> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of(true).pipe(delay(300));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .post<unknown>(`${this.apiUrl}/vincular-personal`, {
        personal_id: data.personalId,
        nombre: data.name,
      })
      .pipe(
        map(() => true),
        catchError((error) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudo vincular la ficha de personal.')),
          ),
        ),
      );
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of({
        user: { id: 'mock-user', email: 'mock@tienda.com', name: 'Mock' },
        token: 'mock-jwt-token-xyz-123456789',
        refreshToken,
      }).pipe(delay(300));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.post<unknown>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken }).pipe(
      map((res) => adaptAuthResponseFromBackend(res)),
      catchError((error) => throwError(() => new Error(toUserMessage(error, 'Tu sesión expiró.')))),
    );
  }

  private mockLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    if (credentials.email && credentials.password.length >= 6) {
      const name = credentials.email.split('@')[0];
      const mockUser: User = {
        id: Math.floor(Math.random() * 1000),
        email: credentials.email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        // Convención E2E (`R-E-12`): un correo que empieza con `vendedor` entra
        // con rol vendedor y uno con `empresario` con rol empresario (ADR-26,
        // ADR-27) para probar el panel sin backend.
        role: credentials.email.startsWith('admin')
          ? 'admin'
          : credentials.email.startsWith('empresario')
            ? 'empresario'
            : credentials.email.startsWith('vendedor')
              ? 'vendedor'
              : 'comprador',
      };
      return of({
        user: mockUser,
        token: 'mock-jwt-token-xyz-123456789',
        refreshToken: 'mock-refresh-token-xyz',
      }).pipe(delay(600));
    } else {
      return throwError(
        () => new Error('Credenciales inválidas (la contraseña requiere mínimo 6 caracteres).'),
      );
    }
  }

  private mockRegister(userData: RegisterData): Observable<AuthResponse> {
    const mockUser: User = {
      id: Math.floor(Math.random() * 1000),
      email: userData.email,
      name: userData.name,
      role: userData.role === 'seller' || userData.role === 'biller' ? 'empresario' : 'comprador',
    };
    return of({
      user: mockUser,
      token: 'mock-jwt-token-xyz-123456789',
      refreshToken: 'mock-refresh-token-xyz',
    }).pipe(delay(600));
  }
}
