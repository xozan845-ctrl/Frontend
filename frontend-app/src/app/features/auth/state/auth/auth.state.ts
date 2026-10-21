import type { User } from '../../models/auth.model';

export interface AuthState {
  user: User | null;
  /** Access token: vive solo en memoria (R-SE-1). */
  token: string | null;
  /** Refresh token: se persiste en sessionStorage (R-SE-1). */
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
