/** Subconjunto de producto que necesita la vista rápida (sin acoplarse a un feature). */
export interface QuickViewProduct {
  id: string | number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  stock: number;
}
