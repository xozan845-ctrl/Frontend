import { Component, computed, effect, input, output, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import type { CatalogProduct } from '../../../products/public-api';
import { createCompanySaleLineId } from '../../constants/company-sales.constants';
import { CompanySalePaymentMethodsComponent } from '../company-sale-payment-methods/company-sale-payment-methods.component';
import { OrderTotalsComponent } from '../../../../shared/orders/components/order-totals/order-totals.component';
import type {
  CompanySaleLine,
  CompanySalePaymentMethod,
  CreateCompanySalePayload,
} from '../../models/company-sale.model';

function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * POS de Venta rápida (ADR-53): escanea o escribe un código, acumula líneas y
 * emite el payload de cobro. No conoce stores ni HTTP (`R-SO-8`).
 */
@Component({
  selector: 'app-company-quick-sale-modal',
  standalone: true,
  imports: [
    AppCurrencyPipe,
    FocusTrapDirective,
    CompanySalePaymentMethodsComponent,
    OrderTotalsComponent,
  ],
  templateUrl: './company-quick-sale-modal.component.html',
})
export class CompanyQuickSaleModalComponent {
  readonly open = input(false);
  readonly products = input<readonly CatalogProduct[]>([]);
  readonly nextNumber = input('V-000001');
  readonly error = input<string | null>(null);
  readonly submitSale = output<CreateCompanySalePayload>();
  readonly dismiss = output<void>();

  readonly scan = signal('');
  readonly lines = signal<CompanySaleLine[]>([]);
  readonly paymentMethod = signal<CompanySalePaymentMethod>('efectivo');
  readonly saleDate = signal(todayInput());
  readonly scanError = signal<string | null>(null);

  readonly productsByCode = computed(
    () =>
      new Map(
        this.products()
          .filter((product) => product.status === 'disponible')
          .map((product) => [product.sku.toLocaleLowerCase('es'), product]),
      ),
  );

  readonly suggestions = computed(() => {
    const term = this.scan().trim().toLocaleLowerCase('es');
    if (!term) return [];
    return this.products()
      .filter(
        (product) =>
          product.status === 'disponible' &&
          `${product.name} ${product.sku}`.toLocaleLowerCase('es').includes(term),
      )
      .slice(0, 5);
  });

  readonly subtotal = computed(() =>
    toMoney(this.lines().reduce((sum, line) => sum + line.subtotal, 0)),
  );
  readonly total = computed(() => this.subtotal());
  readonly hasItems = computed(() => this.lines().length > 0);
  readonly canSubmit = computed(() => this.hasItems() && this.total() > 0 && !!this.saleDate());

  private readonly resetOnOpen = effect(() => {
    if (this.open()) this.reset();
  });

  reset(): void {
    this.scan.set('');
    this.lines.set([]);
    this.paymentMethod.set('efectivo');
    this.saleDate.set(todayInput());
    this.scanError.set(null);
  }

  setScan(event: Event): void {
    this.scan.set((event.target as HTMLInputElement).value);
    this.scanError.set(null);
  }

  setSaleDate(event: Event): void {
    this.saleDate.set((event.target as HTMLInputElement).value);
  }

  onScanSubmit(): void {
    const term = this.scan().trim();
    if (!term) return;
    const exact = this.productsByCode().get(term.toLocaleLowerCase('es'));
    const fallback = this.products().find(
      (product) =>
        product.status === 'disponible' &&
        product.name.toLocaleLowerCase('es') === term.toLocaleLowerCase('es'),
    );
    const product = exact ?? fallback;
    if (!product) {
      this.scanError.set('No encontramos un producto con ese código o nombre.');
      return;
    }
    this.addProduct(product);
    this.scan.set('');
    this.scanError.set(null);
  }

  addSuggestion(product: CatalogProduct): void {
    this.addProduct(product);
    this.scan.set('');
  }

  addProduct(product: CatalogProduct): void {
    const current = this.lines();
    const existing = current.find(
      (line) => line.kind === 'product' && line.referenceId === product.id,
    );
    if (existing) {
      this.incrementLine(existing.id);
      return;
    }

    this.lines.set([
      ...current,
      {
        id: createCompanySaleLineId(),
        kind: 'product',
        referenceId: product.id,
        code: product.sku,
        name: product.name,
        quantity: 1,
        unitPrice: toMoney(product.basePrice),
        subtotal: toMoney(product.basePrice),
      },
    ]);
    this.scanError.set(null);
  }

  incrementLine(id: string): void {
    this.lines.set(
      this.lines().map((line) =>
        line.id === id
          ? {
              ...line,
              quantity: line.quantity + 1,
              subtotal: toMoney((line.quantity + 1) * line.unitPrice),
            }
          : line,
      ),
    );
  }

  decrementLine(id: string): void {
    this.lines.set(
      this.lines()
        .map((line) =>
          line.id === id
            ? {
                ...line,
                quantity: line.quantity - 1,
                subtotal: toMoney((line.quantity - 1) * line.unitPrice),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  removeLine(id: string): void {
    this.lines.set(this.lines().filter((line) => line.id !== id));
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitSale.emit({
      client: { mode: 'final', name: 'Consumidor final' },
      lines: this.lines(),
      paymentMethod: this.paymentMethod(),
      date: this.saleDate(),
      discountPercent: 0,
      notes: 'Venta rápida',
    });
  }
}
