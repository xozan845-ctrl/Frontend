export interface Review {
  id: string;
  productId: string | number;
  authorName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO string
}
