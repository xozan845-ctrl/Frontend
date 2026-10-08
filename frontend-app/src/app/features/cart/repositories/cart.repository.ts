import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CartItem } from '../models/cart.model';

/**
 * Puerto del carrito del servidor (Core Engine `/carrito`, rol comprador).
 * Todas las operaciones devuelven el carrito ya normalizado.
 */
export interface CartRepository {
  getCart(): Observable<CartItem[]>;
  addItem(ofertaId: string, quantity: number): Observable<CartItem[]>;
  /** Cantidad 0 elimina el ítem. */
  updateQuantity(ofertaId: string, quantity: number): Observable<CartItem[]>;
  removeItem(ofertaId: string): Observable<CartItem[]>;
  clearCart(): Observable<CartItem[]>;
}

export const CART_REPOSITORY = new InjectionToken<CartRepository>('CartRepository');
