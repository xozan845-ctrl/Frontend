import type {
  CompanyInventoryMovement,
  CompanyPromotion,
} from './company-catalog-operations.model';

/** Etiqueta humana del tipo de promoción. */
export function promotionTypeLabel(type: CompanyPromotion['type']): string {
  switch (type) {
    case '2x1':
      return '2 × 1';
    case 'descuento_cantidad':
      return 'Descuento por cantidad';
    case 'descuento_porcentaje':
      return 'Descuento %';
    case 'regalo':
      return 'Regalo';
  }
}

/** Detalle legible de la promoción. */
export function promotionDetailLabel(promotion: CompanyPromotion): string {
  switch (promotion.type) {
    case 'descuento_porcentaje':
      return promotion.discountPercentage ? `${promotion.discountPercentage} %` : '—';
    case '2x1':
      return promotion.sku || 'Todos los productos';
    default:
      return `${promotion.requiredQuantity ?? 0} × ${promotion.freeQuantity ?? 0}${
        promotion.sku ? ` · ${promotion.sku}` : ''
      }`;
  }
}

/** Etiqueta humana del tipo de movimiento. */
export function movementTypeLabel(type: CompanyInventoryMovement['type']): string {
  switch (type) {
    case 'entrada':
      return 'Entrada';
    case 'salida':
      return 'Salida';
    case 'ajuste':
      return 'Ajuste';
    case 'traslado':
      return 'Traslado';
  }
}
