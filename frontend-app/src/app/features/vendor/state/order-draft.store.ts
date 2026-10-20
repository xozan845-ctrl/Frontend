import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { VENDOR_DRAFT_STORAGE_KEY, VENDOR_TAX_RATE } from '../constants/vendor.constants';
import {
  Client,
  CreateOrderPayload,
  OrderDraft,
  OrderDraftInfo,
  OrderDraftLine,
  VendorProduct,
} from '../models/vendor-order.model';
import { VENDOR_ORDER_REPOSITORY } from '../repositories/vendor-order.repository';
import type { OrderDraftState } from './vendor.state';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 999;

/** Fecha local de hoy en `yyyy-mm-dd` para el input de fecha (`R-U-5`). */
function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function defaultInfo(): OrderDraftInfo {
  return {
    storeId: '',
    storeName: '',
    date: todayIsoDate(),
    deliveryMethod: 'retiro_tienda',
  };
}

function createInitialState(): OrderDraftState {
  return {
    client: null,
    info: defaultInfo(),
    lines: [],
    discountPercent: 0,
    observations: '',
    submitting: false,
    error: null,
    lastCreatedOrder: null,
  };
}

/** Redondea a 2 decimales para no arrastrar error de coma flotante (`R-U-6`). */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Descuento porcentual saneado a 0–100; lo inválido cae a 0 (`R-U-8`). */
function clampPercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, round2(n)));
}

/** Cantidad entera saneada a 1–999: una línea existente siempre lleva pieza (`R-U-8`). */
function clampQuantity(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(n)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/** Producto del borrador saneado tras leer storage ajeno (`R-RB-4`). */
function sanitizeProduct(value: unknown): VendorProduct | null {
  if (!isRecord(value)) return null;
  const id = value['id'];
  if (typeof id !== 'string' || !id) return null;
  const price = value['price'];
  return {
    id,
    name: toText(value['name'], 'Producto'),
    sku: toText(value['sku']),
    category: toText(value['category'], 'General'),
    price: typeof price === 'number' && Number.isFinite(price) && price >= 0 ? round2(price) : 0,
    imageUrl: toText(value['imageUrl']),
    inStock: typeof value['inStock'] === 'boolean' ? value['inStock'] : true,
  };
}

function sanitizeClient(value: unknown): Client | null {
  if (!isRecord(value)) return null;
  const id = value['id'];
  if (typeof id !== 'string' || !id) return null;
  return {
    id,
    code: toText(value['code']),
    name: toText(value['name'], 'Cliente'),
    phone: toText(value['phone']),
    email: toText(value['email']),
  };
}

function sanitizeInfo(value: unknown): OrderDraftInfo {
  const base = defaultInfo();
  if (!isRecord(value)) return base;
  const date = value['date'];
  return {
    storeId: toText(value['storeId']),
    storeName: toText(value['storeName']),
    date: typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : base.date,
    deliveryMethod:
      value['deliveryMethod'] === 'envio_domicilio' ? 'envio_domicilio' : 'retiro_tienda',
  };
}

/** Líneas saneadas: descarta sin producto o duplicadas y acota cantidades. */
function sanitizeLines(value: unknown): OrderDraftLine[] {
  if (!Array.isArray(value)) return [];
  const lines: OrderDraftLine[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const product = sanitizeProduct(raw['product']);
    if (!product || lines.some((line) => line.product.id === product.id)) continue;
    lines.push({ product, quantity: clampQuantity(raw['quantity']) });
  }
  return lines;
}

/** Borrador persistido y saneado; `null` si el JSON está corrupto o no es un objeto. */
function parseDraft(raw: string | null): OrderDraft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    return {
      client: sanitizeClient(parsed['client']),
      info: sanitizeInfo(parsed['info']),
      lines: sanitizeLines(parsed['lines']),
      discountPercent: clampPercent(parsed['discountPercent']),
      observations: toText(parsed['observations']),
    };
  } catch {
    return null;
  }
}

function loadStoredDraft(): OrderDraft | null {
  try {
    return parseDraft(localStorage.getItem(VENDOR_DRAFT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function persistDraft(draft: OrderDraft): void {
  try {
    localStorage.setItem(VENDOR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage no disponible: el borrador vive solo en memoria.
  }
}

function clearStoredDraft(): void {
  try {
    localStorage.removeItem(VENDOR_DRAFT_STORAGE_KEY);
  } catch {
    // Storage no disponible: se ignora.
  }
}

/**
 * Borrador del pedido en curso (POS "Nuevo pedido"): fuente de verdad del
 * `OrderDraft` (`R-ST-1`), derivados en `withComputed` (`R-ST-2`) y persistencia
 * tolerante a JSON corrupto en `withHooks` (`R-ST-7`, `R-RB-4`). Es un store de
 * **feature** (no `root`): se provee en la ruta del panel y se libera al salir
 * (`R-AR-5`). `submitOrder` orquesta el POST con `rxMethod` (`R-ST-5`).
 */
export const OrderDraftStore = signalStore(
  withState(createInitialState()),
  withComputed((store) => {
    const lineCount = computed(() => store.lines().reduce((acc, line) => acc + line.quantity, 0));
    const subtotal = computed(() =>
      round2(store.lines().reduce((acc, line) => acc + line.product.price * line.quantity, 0)),
    );
    const discountAmount = computed(() => round2((subtotal() * store.discountPercent()) / 100));
    const taxAmount = computed(() => round2((subtotal() - discountAmount()) * VENDOR_TAX_RATE));
    const total = computed(() => round2(subtotal() - discountAmount() + taxAmount()));
    const isEmpty = computed(() => store.lines().length === 0);

    return { lineCount, subtotal, discountAmount, taxAmount, total, isEmpty };
  }),
  withMethods(
    (
      store,
      orderRepo = inject(VENDOR_ORDER_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const draft = (): OrderDraft => ({
        client: store.client(),
        info: store.info(),
        lines: store.lines(),
        discountPercent: store.discountPercent(),
        observations: store.observations(),
      });

      const buildPayload = (): CreateOrderPayload => ({
        clientId: store.client()?.id ?? null,
        storeId: store.info().storeId,
        date: store.info().date,
        deliveryMethod: store.info().deliveryMethod,
        discountPercent: store.discountPercent(),
        observations: store.observations(),
        items: store.lines().map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      });

      return {
        /** Selecciona (o quita con `null`) el cliente del pedido. */
        selectClient(client: Client | null): void {
          patchState(store, { client });
        },

        /** Actualiza tienda, fecha o método de entrega del panel de información. */
        setOrderInfo(partial: Partial<OrderDraftInfo>): void {
          patchState(store, { info: sanitizeInfo({ ...store.info(), ...partial }) });
        },

        /**
         * Agrega una unidad del producto (o incrementa su línea). Un producto
         * sin existencias explícitas no se agrega; el dato faltante ya llega
         * como `inStock: true` desde el adapter.
         */
        addLine(product: VendorProduct): void {
          if (!product.inStock) return;
          const lines = store.lines();
          const index = lines.findIndex((line) => line.product.id === product.id);
          const next =
            index > -1
              ? lines.map((line, i) =>
                  i === index
                    ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + 1) }
                    : line,
                )
              : [...lines, { product, quantity: 1 }];
          patchState(store, { lines: next });
        },

        /** Fija la cantidad de una línea (saneada 1–999); si no existe, no hace nada. */
        updateQuantity(productId: string, quantity: number): void {
          const lines = store.lines();
          if (!lines.some((line) => line.product.id === productId)) return;
          patchState(store, {
            lines: lines.map((line) =>
              line.product.id === productId ? { ...line, quantity: clampQuantity(quantity) } : line,
            ),
          });
        },

        /** Quita la línea del producto del borrador. */
        removeLine(productId: string): void {
          patchState(store, {
            lines: store.lines().filter((line) => line.product.id !== productId),
          });
        },

        /** Fija el descuento porcentual (0–100). */
        setDiscountPercent(value: number): void {
          patchState(store, { discountPercent: clampPercent(value) });
        },

        /** Fija las observaciones del pedido. */
        setObservations(text: string): void {
          patchState(store, { observations: text });
        },

        /** Persiste el borrador y confirma al usuario (el guardado también es automático). */
        saveDraft(): void {
          persistDraft(draft());
          notificationService.showSuccess('Borrador del pedido guardado.');
        },

        /** Descarta el borrador actual (memoria y storage), conservando la tienda. */
        clearDraft(): void {
          const { storeId, storeName } = store.info();
          clearStoredDraft();
          patchState(store, {
            ...createInitialState(),
            info: { ...defaultInfo(), storeId, storeName },
          });
        },

        /**
         * Registra el pedido (`POST /vendedores/pedidos`), notifica y limpia el
         * borrador; deja el pedido en `lastCreatedOrder` para refrescar los
         * recientes (`R-ST-5`, `R-AR-10`). Un segundo envío mientras hay uno en
         * curso se descarta (`filter`).
         */
        submitOrder: rxMethod<void>(
          pipe(
            filter(() => !store.submitting()),
            tap(() => patchState(store, { submitting: true, error: null })),
            switchMap(() => {
              if (store.lines().length === 0) {
                const message = 'Agrega al menos un producto para registrar el pedido.';
                patchState(store, { submitting: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }

              return orderRepo.createOrder(buildPayload()).pipe(
                tap((order) => {
                  const { storeId, storeName } = store.info();
                  patchState(store, {
                    ...createInitialState(),
                    info: { ...defaultInfo(), storeId, storeName },
                    lastCreatedOrder: order,
                  });
                  notificationService.showSuccess(`Pedido ${order.id} registrado.`);
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo registrar el pedido.';
                  patchState(store, { submitting: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
      };
    },
  ),
  withHooks({
    onInit(store) {
      const restored = loadStoredDraft();
      if (restored) patchState(store, restored);

      // Persistencia centralizada y tolerante al salir de la ruta (`R-ST-7`).
      effect(() => {
        persistDraft({
          client: store.client(),
          info: store.info(),
          lines: store.lines(),
          discountPercent: store.discountPercent(),
          observations: store.observations(),
        });
      });
    },
  }),
);
