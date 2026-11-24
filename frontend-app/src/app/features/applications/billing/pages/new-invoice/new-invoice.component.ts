import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '@core/services/seo/seo.service';
import { BILLING_CLIENTS, BILLING_PRODUCTS } from '../../constants/billing.fixtures';
import { BillingDemoBannerComponent } from '../../components/billing-demo-banner/billing-demo-banner.component';
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
  Invoice,
  InvoiceInfo,
  InvoiceLine,
  calculateInvoiceTotals,
} from '../../models/billing.model';

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
 * Página "Nueva factura" (ADR-23, `R-DO-3`): POS interactivo de la demo de
 * facturación. Se puede armar una factura con el catálogo de muestra, pero no
 * hay emisión, guardado ni alta de clientes: el módulo está etiquetado como
 * `demo` y solo opera con fuente real una vez integrado. Sin stores ni puertos.
 */
@Component({
  selector: 'app-billing-new-invoice',
  standalone: true,
  imports: [
    RouterLink,
    BillingDemoBannerComponent,
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
    'Explora el POS de facturación y arma una factura de demostración sin emitirla ni guardarla.',
  );
  private readonly recentInvoicesSection =
    viewChild<ElementRef<HTMLElement>>('recentInvoicesSection');

  readonly products = BILLING_PRODUCTS;
  readonly recentInvoices: readonly Invoice[] = [];

  readonly clientQuery = signal('');
  readonly selectedClient = signal<BillingClient | null>(null);
  readonly catalogQuery = signal('');
  readonly category = signal<string | null>(null);
  readonly lines = signal<InvoiceLine[]>([]);
  readonly notes = signal('');
  readonly discountPercent = signal(0);
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
  }

  clearClient(): void {
    this.selectedClient.set(null);
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
}
