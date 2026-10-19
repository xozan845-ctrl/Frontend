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
  /**
   * Rol registrable: comprador (por defecto), vendedor (para crear tienda) o
   * facturador (cuenta de facturación; se registra como vendedor hasta que el
   * backend exponga un rol propio, ADR-24).
   */
  role?: 'customer' | 'seller' | 'biller';
}
