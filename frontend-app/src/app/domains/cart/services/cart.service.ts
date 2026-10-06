import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CartItem } from '../models/cart.model';

/**
 * CartService (Placeholder / Stub Intencional)
 *
 * En la arquitectura actual, la persistencia y estado reactivo del carrito residen
 * localmente en `CartStore` mediante `localStorage`.
 * Este servicio sirve como punto de extensión e infraestructura para futura sincronización
 * del carrito en backend (por ejemplo, al iniciar sesión con una cuenta de usuario).
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  saveCart(_items: CartItem[]): Observable<boolean> {
    // Punto de integración para PUT/POST /cart/sync
    return of(true);
  }

  fetchCart(): Observable<CartItem[]> {
    // Punto de integración para GET /cart/sync
    return of([]);
  }
}
