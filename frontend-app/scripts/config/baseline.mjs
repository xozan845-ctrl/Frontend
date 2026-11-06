/**
 * config/baseline.mjs — Deuda arquitectónica aceptada.
 *
 * GENERADO por `npm run rules:baseline`. Cada clave es un hallazgo que ya
 * existía al introducir el motor. El check falla ante hallazgos NUEVOS.
 * Elimina entradas al corregir la deuda; no las añadas para silenciar
 * violaciones nuevas.
 */
export const baseline = {
  'architecture-types': [],
  // Deuda conocida: el storefront comparte stores de carrito, productos y
  // wishlist. Se resolverá al extraer el dominio de storefront (fase 2).
  'architecture-layers': ['cycle|applications/cart|applications/products|applications/wishlist'],
  'architecture-lifecycle': [],
  'architecture-config': [],
  'architecture-packaging': [],
  'presentation-guards': [],
  'performance-guards': [],
};

/** Claves aceptadas para una suite (para validar el propio baseline). */
export function baselineFor(suiteId) {
  return new Set(baseline[suiteId] ?? []);
}
