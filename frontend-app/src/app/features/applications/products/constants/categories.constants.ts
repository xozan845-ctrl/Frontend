export const PRODUCT_CATEGORIES = [
  'Laptops',
  'Smartphones',
  'Audio',
  'Smartwatches',
  'Electronics',
  'Accessories',
  'Fitness',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const FILTER_CATEGORIES = ['All', ...PRODUCT_CATEGORIES] as const;
