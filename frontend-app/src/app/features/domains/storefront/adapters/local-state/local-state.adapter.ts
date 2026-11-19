import type { CartItem } from '../../models/cart.model';
import type { Product, ProductVariant } from '../../models/product.model';
import type { Review } from '../../models/review.model';
import type { NormalizedCollectionResult, UnknownRecord } from '../../models/local-state.model';
import {
  LOCAL_STATE_CONTEXT,
  LOCAL_STATE_LIMITS,
  LOCAL_STATE_SCHEMA_VERSION,
} from '../../constants/local-state.constants';

function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isId(value: unknown): value is string | number {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isBoundedString(value: unknown): value is string {
  return typeof value === 'string' && value.length <= LOCAL_STATE_LIMITS.text;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveQuantity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= LOCAL_STATE_LIMITS.quantity
  );
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= LOCAL_STATE_LIMITS.text ? trimmed : undefined;
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function normalizeVariant(value: unknown): ProductVariant | undefined {
  if (!isRecord(value)) return undefined;

  const rawColors = value['colors'];
  const colors = Array.isArray(rawColors)
    ? rawColors
        .filter(isRecord)
        .map((color) => {
          const name = asOptionalString(color['name']);
          const hex = asOptionalString(color['hex']);
          return name && hex ? { name, hex } : null;
        })
        .filter((color): color is { name: string; hex: string } => color !== null)
        .slice(0, 20)
    : [];

  const rawSpecs = value['specs'];
  const specs = Array.isArray(rawSpecs)
    ? rawSpecs
        .filter((spec): spec is string => typeof spec === 'string')
        .map((spec) => spec.trim())
        .filter((spec) => spec.length > 0 && spec.length <= LOCAL_STATE_LIMITS.text)
        .slice(0, 20)
    : [];

  if (colors.length === 0 && specs.length === 0) return undefined;
  return {
    ...(colors.length > 0 ? { colors } : {}),
    ...(specs.length > 0 ? { specs } : {}),
  };
}

/** Normaliza un producto persistido; `null` si no cumple el modelo. */
export function normalizePersistedProduct(value: unknown): Product | null {
  if (!isRecord(value)) return null;

  const id = value['id'];
  const name = value['name'];
  const description = value['description'];
  const price = value['price'];
  const imageUrl = value['imageUrl'];
  const category = value['category'];
  const stock = value['stock'];

  if (
    !isId(id) ||
    !isNonEmptyString(name) ||
    !isBoundedString(description) ||
    !isNonNegativeNumber(price) ||
    !isBoundedString(imageUrl) ||
    !isNonEmptyString(category) ||
    !isNonNegativeNumber(stock) ||
    !Number.isInteger(stock)
  ) {
    return null;
  }

  const originalPrice = value['originalPrice'];
  const rawImages = value['images'];
  const images = Array.isArray(rawImages)
    ? rawImages
        .filter((image): image is string => isBoundedString(image))
        .map((image) => image.trim())
        .filter((image) => image.length > 0)
        .slice(0, 20)
    : [];
  const variants = normalizeVariant(value['variants']);

  return {
    id,
    name: name.trim(),
    description,
    price,
    ...(isNonNegativeNumber(originalPrice) ? { originalPrice } : {}),
    imageUrl,
    ...(images.length > 0 ? { images } : {}),
    category: category.trim(),
    stock,
    ...(variants ? { variants } : {}),
  };
}

/** Normaliza una línea de carrito persistida; `null` si no es válida. */
export function normalizePersistedCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;

  const product = normalizePersistedProduct(value['product']);
  const quantity = value['quantity'];
  if (!product || !isPositiveQuantity(quantity)) return null;

  const item: CartItem = { product, quantity };
  const offerId = asOptionalString(value['offerId']);
  const storeId = asOptionalString(value['storeId']);
  const sellerId = asOptionalString(value['sellerId']);
  const sku = asOptionalString(value['sku']);
  const status = asOptionalString(value['status']);

  if (offerId) item.offerId = offerId;
  if (storeId) item.storeId = storeId;
  if (sellerId) item.sellerId = sellerId;
  if (sku) item.sku = sku;
  if (status) item.status = status;
  return item;
}

/** Normaliza una reseña persistida; `null` si no cumple el modelo. */
export function normalizePersistedReview(value: unknown): Review | null {
  if (!isRecord(value)) return null;

  const id = value['id'];
  const productId = value['productId'];
  const authorName = value['authorName'];
  const rating = value['rating'];
  const comment = value['comment'];
  const date = value['date'];

  if (
    !isNonEmptyString(id) ||
    !isId(productId) ||
    !isNonEmptyString(authorName) ||
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !isBoundedString(comment) ||
    !isValidDate(date)
  ) {
    return null;
  }

  return {
    id: id.trim(),
    productId,
    authorName: authorName.trim(),
    rating,
    comment,
    date,
  };
}

function normalizeCollection<T>(
  raw: unknown,
  normalizeItem: (value: unknown) => T | null,
  maxItems: number,
  keyOf: (item: T) => string,
): NormalizedCollectionResult<T> {
  let rawItems: unknown[];
  let legacy = false;

  if (Array.isArray(raw)) {
    rawItems = raw;
    legacy = true;
  } else if (isRecord(raw)) {
    const version = raw['version'];
    if (typeof version !== 'number') return { ok: false, reason: 'invalid-shape' };
    if (version !== LOCAL_STATE_SCHEMA_VERSION) {
      return { ok: false, reason: 'unsupported-version' };
    }
    if (raw['context'] !== LOCAL_STATE_CONTEXT) {
      return { ok: false, reason: 'foreign-context' };
    }
    const items = raw['items'];
    if (!Array.isArray(items)) return { ok: false, reason: 'invalid-shape' };
    rawItems = items;
  } else {
    return { ok: false, reason: 'invalid-shape' };
  }

  const items: T[] = [];
  const seen = new Set<string>();
  let discarded = 0;

  for (const candidate of rawItems) {
    const item = normalizeItem(candidate);
    if (!item) {
      discarded += 1;
      continue;
    }

    const key = keyOf(item);
    if (seen.has(key)) {
      discarded += 1;
      continue;
    }

    if (items.length >= maxItems) {
      discarded += 1;
      continue;
    }

    seen.add(key);
    items.push(item);
  }

  return { ok: true, items, discarded, legacy };
}

export function normalizePersistedCart(raw: unknown): NormalizedCollectionResult<CartItem> {
  return normalizeCollection(
    raw,
    normalizePersistedCartItem,
    LOCAL_STATE_LIMITS.cartItems,
    (item) => String(item.product.id),
  );
}

export function normalizePersistedWishlist(raw: unknown): NormalizedCollectionResult<Product> {
  return normalizeCollection(
    raw,
    normalizePersistedProduct,
    LOCAL_STATE_LIMITS.wishlistItems,
    (product) => String(product.id),
  );
}

export function normalizePersistedReviews(raw: unknown): NormalizedCollectionResult<Review> {
  return normalizeCollection(
    raw,
    normalizePersistedReview,
    LOCAL_STATE_LIMITS.reviews,
    (review) => review.id,
  );
}
