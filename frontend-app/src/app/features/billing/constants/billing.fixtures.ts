import {
  BillingClient,
  BillingProduct,
  Invoice,
  InvoiceLine,
  calculateInvoiceTotals,
} from '../../models/billing.model';
import { PAYMENT_TERM_LABELS } from '../../constants/billing.constants';

/**
 * Datos de presentación del módulo de facturación.
 *
 * Esta fase es **solo visual** (`ADR-23`): las pantallas se alimentan de estos
 * fixtures para validar el diseño. La integración HTTP llegará con los puertos
 * y stores del feature; los fixtures permanecen como contrato de los specs.
 */

export const BILLING_CLIENTS: readonly BillingClient[] = [
  {
    id: 'cli-1',
    name: 'María López',
    code: 'CLI-001',
    phone: '8888-1234',
    email: 'maria.lopez@correo.com',
  },
  {
    id: 'cli-2',
    name: 'Carlos Méndez',
    code: 'CLI-002',
    phone: '8777-5678',
    email: 'carlos.mendez@correo.com',
  },
  {
    id: 'cli-3',
    name: 'Farmacia San José',
    code: 'CLI-003',
    phone: '2266-9090',
    email: 'compras@farmaciasanjose.com',
  },
  {
    id: 'cli-4',
    name: 'Laura Gutiérrez',
    code: 'CLI-004',
    phone: '8555-4321',
    email: 'laura.gutierrez@correo.com',
  },
];

export const BILLING_PRODUCTS: readonly BillingProduct[] = [
  {
    id: 'prod-1',
    name: 'Crema hidratante facial',
    sku: 'CR-001',
    category: 'Cremas',
    price: 480,
    inStock: true,
  },
  {
    id: 'prod-2',
    name: 'Crema corporal de karité',
    sku: 'CR-002',
    category: 'Cremas',
    price: 320,
    inStock: true,
  },
  {
    id: 'prod-3',
    name: 'Shampoo reparador',
    sku: 'CC-001',
    category: 'Cuidado capilar',
    price: 260,
    inStock: true,
  },
  {
    id: 'prod-4',
    name: 'Acondicionador nutritivo',
    sku: 'CC-002',
    category: 'Cuidado capilar',
    price: 240,
    inStock: true,
  },
  {
    id: 'prod-5',
    name: 'Mascarilla capilar intensiva',
    sku: 'CC-003',
    category: 'Cuidado capilar',
    price: 390,
    inStock: true,
  },
  {
    id: 'prod-6',
    name: 'Tinte castaño 4.0',
    sku: 'TI-001',
    category: 'Tintes',
    price: 210,
    inStock: true,
  },
  {
    id: 'prod-7',
    name: 'Tinte rubio 7.1',
    sku: 'TI-002',
    category: 'Tintes',
    price: 210,
    inStock: false,
  },
  {
    id: 'prod-8',
    name: 'Sérum reparador de puntas',
    sku: 'TR-001',
    category: 'Tratamientos',
    price: 550,
    inStock: true,
  },
];

const line = (
  productId: string,
  quantity: number,
  overrides?: Partial<InvoiceLine>,
): InvoiceLine => {
  const product = BILLING_PRODUCTS.find((item) => item.id === productId);
  if (!product) {
    throw new Error(`Producto de fixture inexistente: ${productId}`);
  }

  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    unitPrice: product.price,
    quantity,
    ...overrides,
  };
};

const buildInvoice = (
  base: Omit<Invoice, 'subtotal' | 'discountAmount' | 'taxAmount' | 'total' | 'dueAt' | 'notes'> & {
    notes?: string;
    dueAt?: string | null;
  },
): Invoice => {
  const totals = calculateInvoiceTotals(base.lines, base.discountPercent);
  return {
    ...base,
    dueAt: base.dueAt ?? null,
    notes: base.notes ?? '',
    ...totals,
  };
};

export const BILLING_INVOICES: readonly Invoice[] = [
  buildInvoice({
    id: 'fac-1',
    number: 'FAC-2026-0001',
    clientId: 'cli-1',
    clientName: BILLING_CLIENTS[0].name,
    clientCode: BILLING_CLIENTS[0].code,
    issuedAt: '2026-10-18',
    dueAt: '2026-10-18',
    paymentTerm: 'contado',
    status: 'pagada',
    discountPercent: 0,
    lines: [line('prod-1', 2), line('prod-8', 1)],
    notes: 'Pago recibido en caja.',
  }),
  buildInvoice({
    id: 'fac-2',
    number: 'FAC-2026-0002',
    clientId: 'cli-2',
    clientName: BILLING_CLIENTS[1].name,
    clientCode: BILLING_CLIENTS[1].code,
    issuedAt: '2026-10-19',
    paymentTerm: 'credito',
    dueAt: '2026-11-18',
    status: 'borrador',
    discountPercent: 5,
    lines: [line('prod-3', 3), line('prod-4', 2)],
  }),
  buildInvoice({
    id: 'fac-3',
    number: 'FAC-2026-0003',
    clientId: 'cli-3',
    clientName: BILLING_CLIENTS[2].name,
    clientCode: BILLING_CLIENTS[2].code,
    issuedAt: '2026-10-17',
    paymentTerm: 'credito',
    dueAt: '2026-11-16',
    status: 'emitida',
    discountPercent: 10,
    lines: [line('prod-2', 6), line('prod-5', 4), line('prod-6', 3)],
    notes: 'Entrega en bodega de la farmacia.',
  }),
  buildInvoice({
    id: 'fac-4',
    number: 'FAC-2026-0004',
    clientId: 'cli-4',
    clientName: BILLING_CLIENTS[3].name,
    clientCode: BILLING_CLIENTS[3].code,
    issuedAt: '2026-10-16',
    paymentTerm: 'contado',
    status: 'anulada',
    discountPercent: 0,
    lines: [line('prod-7', 1)],
    notes: 'Anulada por cambio de tono solicitado por la clienta.',
  }),
  buildInvoice({
    id: 'fac-5',
    number: 'FAC-2026-0005',
    clientId: 'cli-1',
    clientName: BILLING_CLIENTS[0].name,
    clientCode: BILLING_CLIENTS[0].code,
    issuedAt: '2026-10-15',
    dueAt: '2026-10-15',
    paymentTerm: 'contado',
    status: 'pagada',
    discountPercent: 0,
    lines: [line('prod-8', 2)],
  }),
];

/** Etiqueta de la condición de pago para la vista de detalle. */
export const paymentTermLabel = (term: Invoice['paymentTerm']): string => PAYMENT_TERM_LABELS[term];
