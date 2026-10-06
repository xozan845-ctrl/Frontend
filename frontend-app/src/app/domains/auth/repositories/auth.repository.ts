import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, LoginCredentials, RegisterData } from '../models/auth.model';

export interface AuthRepository {
  login(credentials: LoginCredentials): Observable<AuthResponse>;
  register(userData: RegisterData): Observable<AuthResponse>;
  refresh(refreshToken: string): Observable<AuthResponse>;
  logout(): Observable<boolean>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
