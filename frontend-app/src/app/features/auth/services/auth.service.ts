import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../models/auth.model';
import { adaptAuthResponseFromBackend } from '../adapters/auth.adapter';
import { AuthRepository } from '../repositories/auth.repository';

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
      .pipe(map((res) => adaptAuthResponseFromBackend(res, credentials.email)));
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
        rol: 'comprador',
      })
      .pipe(map((res) => adaptAuthResponseFromBackend(res, userData.email)));
  }

  logout(): Observable<boolean> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of(true).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.post<unknown>(`${this.apiUrl}/logout`, {}).pipe(map(() => true));
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

    return this.http
      .post<unknown>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken })
      .pipe(map((res) => adaptAuthResponseFromBackend(res)));
  }

  private mockLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    if (credentials.email && credentials.password.length >= 6) {
      const name = credentials.email.split('@')[0];
      const mockUser: User = {
        id: Math.floor(Math.random() * 1000),
        email: credentials.email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
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
    };
    return of({
      user: mockUser,
      token: 'mock-jwt-token-xyz-123456789',
      refreshToken: 'mock-refresh-token-xyz',
    }).pipe(delay(600));
  }
}
