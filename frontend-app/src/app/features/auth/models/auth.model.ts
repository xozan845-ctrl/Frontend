export interface User {
  id: string | number;
  email: string;
  name: string;
  role?: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  /** Rol registrable: comprador (por defecto) o vendedor (para crear tienda). */
  role?: 'customer' | 'seller';
}
