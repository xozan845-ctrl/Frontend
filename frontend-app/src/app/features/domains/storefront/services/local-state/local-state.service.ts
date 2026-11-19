import { inject, Injectable } from '@angular/core';
import {
  normalizePersistedCart,
  normalizePersistedReviews,
  normalizePersistedWishlist,
} from '../../adapters/local-state/local-state.adapter';
import {
  LOCAL_STATE_CONTEXT,
  LOCAL_STATE_KEYS,
  LOCAL_STATE_MESSAGES,
  LOCAL_STATE_SCHEMA_VERSION,
} from '../../constants/local-state.constants';
import type { CartItem } from '../../models/cart.model';
import type {
  CollectionNormalizer,
  LocalStateEnvelope,
  LocalStateRecoveryReason,
  LocalStateResult,
  NormalizedCollectionResult,
} from '../../models/local-state.model';
import type { Product } from '../../models/product.model';
import type { Review } from '../../models/review.model';
import type { LocalStatePort } from '../../repositories/local-state.repository';
import { STORAGE_ENGINE } from '../../repositories/storage-engine.repository';

/**
 * Límite de persistencia del storefront.
 *
 * Valida el JSON desconocido, su versión y su contexto; descarta entradas
 * inválidas y entrega al store un resultado de recuperación explícito. No
 * conoce Angular y no expone el motor de almacenamiento.
 */
@Injectable()
export class LocalStateService implements LocalStatePort {
  private readonly storage = inject(STORAGE_ENGINE);

  readCart(): LocalStateResult<CartItem[]> {
    return this.readCollection(LOCAL_STATE_KEYS.cart, normalizePersistedCart);
  }

  writeCart(items: CartItem[]): void {
    this.writeCollection(LOCAL_STATE_KEYS.cart, items, normalizePersistedCart);
  }

  clearCart(): void {
    this.remove(LOCAL_STATE_KEYS.cart);
  }

  readWishlist(): LocalStateResult<Product[]> {
    return this.readCollection(LOCAL_STATE_KEYS.wishlist, normalizePersistedWishlist);
  }

  writeWishlist(items: Product[]): void {
    this.writeCollection(LOCAL_STATE_KEYS.wishlist, items, normalizePersistedWishlist);
  }

  clearWishlist(): void {
    this.remove(LOCAL_STATE_KEYS.wishlist);
  }

  readReviews(): LocalStateResult<Review[]> {
    return this.readCollection(LOCAL_STATE_KEYS.reviews, normalizePersistedReviews);
  }

  writeReviews(reviews: Review[]): void {
    this.writeCollection(LOCAL_STATE_KEYS.reviews, reviews, normalizePersistedReviews);
  }

  clearReviews(): void {
    this.remove(LOCAL_STATE_KEYS.reviews);
  }

  private readCollection<T>(
    key: string,
    normalize: CollectionNormalizer<T>,
  ): LocalStateResult<T[]> {
    let raw: string | null;
    try {
      raw = this.storage.get(key);
    } catch {
      return this.recovery('storage-unavailable');
    }

    if (raw === null) return this.empty();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return this.recovery('invalid-json');
    }

    let normalized: NormalizedCollectionResult<T>;
    try {
      normalized = normalize(parsed);
    } catch {
      return this.recovery('invalid-shape');
    }

    if (!normalized.ok) return this.recovery(normalized.reason);
    if (normalized.items.length === 0 && normalized.discarded === 0) return this.empty();

    const recovered = normalized.discarded > 0;
    return {
      value: normalized.items,
      restored: normalized.items.length > 0,
      recovered,
      discarded: normalized.discarded,
      reason: recovered ? 'partially-discarded' : null,
      message: recovered ? LOCAL_STATE_MESSAGES['partially-discarded'] : null,
    };
  }

  private writeCollection<T>(key: string, items: T[], normalize: CollectionNormalizer<T>): void {
    let normalized: NormalizedCollectionResult<T>;
    try {
      normalized = normalize({
        version: LOCAL_STATE_SCHEMA_VERSION,
        context: LOCAL_STATE_CONTEXT,
        items,
      });
    } catch {
      return;
    }

    if (!normalized.ok) return;
    if (normalized.items.length === 0) {
      this.remove(key);
      return;
    }

    const envelope: LocalStateEnvelope<T> = {
      version: LOCAL_STATE_SCHEMA_VERSION,
      context: LOCAL_STATE_CONTEXT,
      items: normalized.items,
    };

    try {
      this.storage.set(key, JSON.stringify(envelope));
    } catch {
      // Storage no disponible: el estado en memoria sigue siendo la verdad.
    }
  }

  private remove(key: string): void {
    try {
      this.storage.remove(key);
    } catch {
      // Storage no disponible: no hay nada que limpiar.
    }
  }

  private empty<T>(): LocalStateResult<T[]> {
    return {
      value: [],
      restored: false,
      recovered: false,
      discarded: 0,
      reason: null,
      message: null,
    };
  }

  private recovery<T>(reason: LocalStateRecoveryReason): LocalStateResult<T[]> {
    return {
      value: [],
      restored: false,
      recovered: true,
      discarded: 0,
      reason,
      message: LOCAL_STATE_MESSAGES[reason],
    };
  }
}
