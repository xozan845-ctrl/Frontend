import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  CreateUserData,
  LinkPersonalData,
  LoginCredentials,
  RegisterData,
  User,
} from '../models/auth.model';

export interface AuthRepository {
  login(credentials: LoginCredentials): Observable<AuthResponse>;
  register(userData: RegisterData): Observable<AuthResponse>;
  refresh(refreshToken: string): Observable<AuthResponse>;
  /** Cierra la sesión del `refreshToken` indicado (o todas si se omite). */
  logout(refreshToken?: string): Observable<boolean>;
  /** Perfil de la sesión actual (`GET /auth/me`). */
  me(): Observable<User>;
  /** Solicita el restablecimiento de contraseña por correo (`POST /auth/restablecer-contrasena`). */
  resetPassword(email: string): Observable<boolean>;
  /** Cambia la contraseña autenticada (`POST /auth/cambiar-contrasena`). */
  changePassword(currentPassword: string, newPassword: string): Observable<boolean>;
  /** Alta administrativa de usuario (`POST /auth/crear-usuario`, solo admin). */
  createUser(userData: CreateUserData): Observable<User>;
  /** Vincula la ficha de personal del usuario autenticado (`POST /auth/vincular-personal`). */
  linkPersonal(data: LinkPersonalData): Observable<boolean>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
