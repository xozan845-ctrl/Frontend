import { AuthResponse, User } from '../models/auth.model';

/**
 * Normaliza cualquier respuesta de usuario de backend a la interfaz User
 */
export function adaptUserFromBackend(raw: unknown, fallbackEmail = ''): User {
  if (!raw || typeof raw !== 'object') {
    const defaultName = fallbackEmail ? fallbackEmail.split('@')[0] : 'Usuario';
    return {
      id: `u-${Date.now()}`,
      email: fallbackEmail || 'usuario@ejemplo.com',
      name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
    };
  }

  const u = raw as Record<string, unknown>;
  const rawId =
    u['id'] ??
    u['_id'] ??
    u['userId'] ??
    u['user_id'] ??
    `u-${Math.random().toString(36).slice(2, 7)}`;
  const id = typeof rawId === 'number' ? rawId : String(rawId);

  const email =
    (typeof u['email'] === 'string' && u['email']) ||
    (typeof u['correo'] === 'string' && u['correo']) ||
    fallbackEmail ||
    'usuario@ejemplo.com';
  const rawName = u['name'] ?? u['nombre'] ?? u['fullName'] ?? u['full_name'] ?? u['username'];
  const name =
    typeof rawName === 'string' && rawName ? rawName : email ? email.split('@')[0] : 'Usuario';
  const roles = u['roles'];

  return {
    id,
    email,
    name,
    role:
      (typeof u['role'] === 'string' && u['role']) ||
      (typeof u['rol'] === 'string' && u['rol']) ||
      (Array.isArray(roles) ? String(roles[0]) : '') ||
      'customer',
    avatar:
      (typeof u['avatar'] === 'string' && u['avatar']) ||
      (typeof u['avatar_url'] === 'string' && u['avatar_url']) ||
      (typeof u['photo'] === 'string' && u['photo']) ||
      undefined,
  };
}

/**
 * Normaliza la respuesta completa de autenticación (login / register) de cualquier backend
 */
export function adaptAuthResponseFromBackend(raw: unknown, fallbackEmail = ''): AuthResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      user: adaptUserFromBackend(null, fallbackEmail),
      token: '',
    };
  }

  const res = raw as Record<string, unknown>;

  // Desenvolver si viene dentro de data
  const rawData = res['data'];
  const data = rawData && typeof rawData === 'object' ? (rawData as Record<string, unknown>) : res;

  // Extraer token de múltiples posibles campos
  const token =
    data['token'] ??
    data['access_token'] ??
    data['jwt'] ??
    data['accessToken'] ??
    res['token'] ??
    res['access_token'] ??
    '';

  // Extraer refresh token (R-SE-1)
  const refreshToken =
    data['refresh_token'] ?? data['refreshToken'] ?? res['refresh_token'] ?? res['refreshToken'];

  // Extraer objeto usuario
  const rawUser =
    data['user'] ??
    data['usuario'] ??
    data['profile'] ??
    res['user'] ??
    res['usuario'] ??
    (data['id'] ? data : null);

  const user = adaptUserFromBackend(rawUser, fallbackEmail);

  return {
    user,
    token: typeof token === 'string' ? token : '',
    refreshToken: typeof refreshToken === 'string' ? refreshToken : undefined,
  };
}
