import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CartSnapshot } from '../models/cart.model';

/**
 * Puerto del carrito del servidor (Core Engine `/carrito`, rol comprador).
 * Todas las operaciones devuelven el carrito ya normalizado.
 */
export interface CartRepository {
  getCart(): Observable<CartSnapshot>;
  addItem(ofertaId: string, quantity: number): Observable<CartSnapshot>;
  /** Cantidad 0 elimina el ítem. */
  updateQuantity(ofertaId: string, quantity: number): Observable<CartSnapshot>;
  removeItem(ofertaId: string): Observable<CartSnapshot>;
  clearCart(): Observable<CartSnapshot>;
}

export const CART_REPOSITORY = new InjectionToken<CartRepository>('CartRepository');
