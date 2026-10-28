import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCurrency } from '../../../../../core/config/currency.config';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import {
  BILLING_CLIENTS,
  BILLING_INVOICES,
  BILLING_PRODUCTS,
} from '../../constants/billing.fixtures';
import { CatalogPickerCardComponent } from '../../components/catalog-picker-card/catalog-picker-card.component';
import { ClientSearchCardComponent } from '../../components/client-search-card/client-search-card.component';
import { InvoiceDraftPanelComponent } from '../../components/invoice-draft-panel/invoice-draft-panel.component';
import type { InvoiceLineQuantityChange } from '../../components/invoice-draft-panel/invoice-draft-panel.types';
import { InvoiceInfoCardComponent } from '../../components/invoice-info-card/invoice-info-card.component';
import { InvoiceListTableComponent } from '../../components/invoice-list-table/invoice-list-table.component';
import { BILLING_STORE_NAME, BILLING_TAX_RATE } from '../../constants/billing.constants';
import {
  BillingClient,
  BillingProduct,
  InvoiceInfo,
  InvoiceLine,
  calculateInvoiceTotals,
} from '../../models/billing.model';
import type { BillingNotice } from './new-invoice.types';

const todayISO = (): string => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Página "Nueva factura" (ADR-23): contenedor visual del POS de facturación.
 * Replica el layout del punto de venta del vendedor (cliente, información,
 * catálogo y panel de la factura actual) con datos de presentación. La
 * integración con stores/puertos llega en la fase de lógica; aquí solo se
 * orquesta estado local de UI.
 */
@Component({
  selector: 'app-billing-new-invoice',
  standalone: true,
  imports: [
    RouterLink,
    CatalogPickerCardComponent,
    ClientSearchCardComponent,
    InvoiceDraftPanelComponent,
    InvoiceInfoCardComponent,
    InvoiceListTableComponent,
  ],
  templateUrl: './new-invoice.component.html',
})
export default class NewInvoiceComponent {
  private readonly seoService = injectSeoPage(
    'Nueva factura — Facturación',
    'Arma la factura del cliente, elige productos del catálogo y revisa los totales antes de emitirla.',
  );
  private readonly recentInvoicesSection =
    viewChild<ElementRef<HTMLElement>>('recentInvoicesSection');

  readonly products = BILLING_PRODUCTS;
  readonly recentInvoices = BILLING_INVOICES.slice(0, 3);

  readonly clientQuery = signal('');
  readonly selectedClient = signal<BillingClient | null>(null);
  readonly catalogQuery = signal('');
  readonly category = signal<string | null>(null);
  readonly lines = signal<InvoiceLine[]>([]);
  readonly notes = signal('');
  readonly discountPercent = signal(0);
  readonly notice = signal<BillingNotice | null>(null);
  readonly info = signal<InvoiceInfo>({
    storeName: BILLING_STORE_NAME,
    date: todayISO(),
    paymentTerm: 'contado',
  });

  readonly categories = computed(() => {
    const values = new Set(this.products.map((product) => product.category));
    return [...values].sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly filteredClients = computed(() => {
    const term = normalize(this.clientQuery());
    if (!term) return [...BILLING_CLIENTS];
    return BILLING_CLIENTS.filter((client) =>
      [client.name, client.code, client.phone].some((value) => normalize(value).includes(term)),
    );
  });

  readonly filteredProducts = computed(() => {
    const term = normalize(this.catalogQuery());
    const category = this.category();
    return this.products.filter((product) => {
      const matchesCategory = !category || product.category === category;
      const matchesTerm =
        !term || normalize(product.name).includes(term) || normalize(product.sku).includes(term);
      return matchesCategory && matchesTerm;
    });
  });

  readonly totals = computed(() =>
    calculateInvoiceTotals(this.lines(), this.discountPercent(), BILLING_TAX_RATE),
  );

  setClientQuery(value: string): void {
    this.clientQuery.set(value);
  }

  selectClient(client: BillingClient): void {
    this.selectedClient.set(client);
    this.notice.set(null);
  }

  clearClient(): void {
    this.selectedClient.set(null);
  }

  requestNewClient(): void {
    this.notice.set({
      tone: 'info',
      text: 'Vista de diseño: el alta rápida de clientes se habilitará con la integración.',
    });
  }

  updateInfo(partial: Partial<InvoiceInfo>): void {
    this.info.update((current) => ({ ...current, ...partial }));
  }

  setCatalogQuery(value: string): void {
    this.catalogQuery.set(value);
  }

  setCategory(category: string | null): void {
    this.category.set(category);
  }

  addProduct(product: BillingProduct): void {
    if (!product.inStock) return;

    this.lines.update((lines) => {
      const existing = lines.find((line) => line.productId === product.id);
      if (existing) {
        return lines.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Math.min(999, line.quantity + 1) }
            : line,
        );
      }

      return [
        ...lines,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity: 1,
        },
      ];
    });
    this.notice.set(null);
  }

  updateQuantity(change: InvoiceLineQuantityChange): void {
    const quantity = Math.min(999, Math.max(1, Math.round(change.quantity)));
    this.lines.update((lines) =>
      lines.map((line) => (line.productId === change.productId ? { ...line, quantity } : line)),
    );
  }

  removeLine(productId: string): void {
    this.lines.update((lines) => lines.filter((line) => line.productId !== productId));
  }

  setDiscount(value: number): void {
    const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
    this.discountPercent.set(safe);
  }

  setNotes(value: string): void {
    this.notes.set(value);
  }

  emitInvoice(): void {
    const client = this.selectedClient();
    if (!client) {
      this.notice.set({ tone: 'warning', text: 'Selecciona un cliente para emitir la factura.' });
      return;
    }
    if (this.lines().length === 0) {
      this.notice.set({
        tone: 'warning',
        text: 'Agrega al menos un producto para emitir la factura.',
      });
      return;
    }

    this.notice.set({
      tone: 'success',
      text: `Vista de diseño: la factura de ${client.name} por ${formatCurrency(this.totals().total)} se conectará al backend en la fase de lógica.`,
    });
  }

  saveDraft(): void {
    this.notice.set({
      tone: 'info',
      text: 'Vista de diseño: el borrador se persistirá cuando se conecte el estado del módulo.',
    });
  }

  scrollToRecentInvoices(): void {
    const target = this.recentInvoicesSection()?.nativeElement;
    if (!target) return;
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  protected noticeClasses(tone: BillingNotice['tone']): string {
    const base =
      'flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold';
    switch (tone) {
      case 'success':
        return `${base} border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300`;
      case 'warning':
        return `${base} border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300`;
      default:
        return `${base} border-accent-200 bg-accent-50 text-accent-800 dark:border-accent-800 dark:bg-accent-900/20 dark:text-accent-300`;
    }
  }
}
