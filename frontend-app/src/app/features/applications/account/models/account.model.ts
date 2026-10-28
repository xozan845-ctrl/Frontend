/** Perfil autoritativo que devuelve `GET /auth/me` y se muestra en Mi cuenta. */
export interface AccountProfile {
  email: string;
  role: string;
}

/** Datos mínimos para cambiar la contraseña (`R-AR-7`). */
export interface PasswordChangePayload {
  current: string;
  next: string;
}
