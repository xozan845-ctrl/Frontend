export interface Coupon {
  code: string;
  discountPercentage: number;
  description: string;
}

export const AVAILABLE_COUPONS: Record<string, Coupon> = {
  DESCUENTO10: {
    code: 'DESCUENTO10',
    discountPercentage: 10,
    description: '10% de descuento en el total de tu compra',
  },
  PROMO20: {
    code: 'PROMO20',
    discountPercentage: 20,
    description: '20% de descuento especial de temporada',
  },
};
