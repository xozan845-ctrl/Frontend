import { Product } from '../models/product.model';
import { BackendProductDTO } from '../models/product.dto';
import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../core/models/api-response.dto';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

/**
 * Convierte cualquier formato de producto de un backend al modelo de dominio Product.
 * Es totalmente tolerante a camelCase, snake_case, nombres alternativos y tipos de datos (strings numéricos).
 */
export function adaptProductFromBackend(raw: unknown): Product {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `prod-${Date.now()}`,
      name: 'Producto sin nombre',
      description: '',
      price: 0,
      imageUrl: DEFAULT_FALLBACK_IMAGE,
      category: 'General',
      stock: 0,
    };
  }

  const dto = raw as BackendProductDTO;

  // Normalizar ID
  const rawId =
    dto.id ??
    dto._id ??
    dto.productId ??
    dto.product_id ??
    `p-${Math.random().toString(36).slice(2, 8)}`;
  const id: string | number = typeof rawId === 'number' ? rawId : String(rawId);

  // Normalizar Nombre / Título
  const name =
    dto.nombre || dto.name || dto.title || dto.product_name || dto.label || 'Producto sin nombre';

  // Normalizar Descripción
  const description = dto.descripcion || dto.description || dto.details || dto.desc || '';

  // Normalizar Precio
  const rawPrice = dto.precio_base ?? dto.price ?? dto.unit_price ?? dto.cost ?? dto.amount ?? 0;
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice)) || 0;

  // Normalizar Precio Original (si existe)
  const rawOrigPrice = dto.originalPrice ?? dto.original_price ?? dto.compare_at_price;
  const originalPrice =
    rawOrigPrice != null
      ? typeof rawOrigPrice === 'number'
        ? rawOrigPrice
        : parseFloat(String(rawOrigPrice))
      : undefined;

  // Normalizar Imagen Principal
  const imageUrl =
    dto.imageUrl ||
    dto.image_url ||
    dto.image ||
    dto.thumbnail ||
    dto.photo ||
    DEFAULT_FALLBACK_IMAGE;

  // Normalizar Galería de Imágenes
  const images = dto.images || dto.gallery || dto.photos || [imageUrl];

  // Normalizar Categoría
  let category = 'General';
  if (typeof dto.categoria === 'string' && dto.categoria.trim().length > 0) {
    category = dto.categoria.trim();
  } else if (typeof dto.category === 'string' && dto.category.trim().length > 0) {
    category = dto.category.trim();
  } else if (dto.category && typeof dto.category === 'object') {
    category = dto.category.name || dto.category.title || 'General';
  } else if (dto.category_name || dto.categoryName || dto.department) {
    category = (dto.category_name || dto.categoryName || dto.department)!.trim();
  }

  // Normalizar Stock
  let stock: number;
  if (dto.stock != null) stock = Number(dto.stock);
  else if (dto.inventory != null) stock = Number(dto.inventory);
  else if (dto.quantity != null) stock = Number(dto.quantity);
  else if (dto.stock_quantity != null) stock = Number(dto.stock_quantity);
  else if (dto.in_stock != null) stock = dto.in_stock ? 10 : 0;
  else stock = 10; // Stock default si el backend no maneja inventario

  // Normalizar Variantes
  const variants = dto.variants;

  return {
    id,
    name,
    description,
    price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    imageUrl,
    images: images.length > 0 ? images : [imageUrl],
    category,
    stock,
    variants,
  };
}

/**
 * Convierte cualquier respuesta de lista de productos (plana o paginada) a Product[]
 */
export function adaptProductListFromBackend(response: unknown): Product[] {
  const items = unwrapApiListResponse(response);
  return items.map(adaptProductFromBackend);
}

/**
 * Convierte cualquier respuesta de producto individual a Product
 */
export function adaptSingleProductFromBackend(response: unknown): Product {
  const item = unwrapApiSingleResponse(response);
  return adaptProductFromBackend(item);
}
