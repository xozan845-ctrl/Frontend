import type { LocalStateRecoveryReason } from '../models/local-state.model';

/** Versión del esquema de persistencia local del storefront. */
export const LOCAL_STATE_SCHEMA_VERSION = 1;

/** Contexto que puede leer y escribir las claves del storefront. */
export const LOCAL_STATE_CONTEXT = 'storefront';

/** Claves persistidas; no se comparten con otros contextos de la aplicación. */
export const LOCAL_STATE_KEYS = {
  cart: 'ecom_cart_items',
  wishlist: 'ecom_wishlist',
  reviews: 'ecom_reviews',
} as const;

/** Límites de restauración para evitar datos enormes o manipulados. */
export const LOCAL_STATE_LIMITS = {
  cartItems: 100,
  wishlistItems: 200,
  reviews: 500,
  quantity: 999,
  text: 1000,
} as const;

/** Mensajes de recuperación; dependen solo del motivo, nunca del motor. */
export const LOCAL_STATE_MESSAGES: Record<LocalStateRecoveryReason, string> = {
  'invalid-json': 'Los datos locales estaban dañados y se ignoraron.',
  'invalid-shape': 'Los datos locales no tenían el formato esperado y se ignoraron.',
  'unsupported-version': 'Los datos locales pertenecen a una versión no compatible y se ignoraron.',
  'foreign-context': 'Se ignoraron datos locales de otro contexto.',
  'storage-unavailable': 'No se pudo acceder al almacenamiento local.',
  'partially-discarded': 'Se descartaron algunas entradas locales inválidas.',
};
