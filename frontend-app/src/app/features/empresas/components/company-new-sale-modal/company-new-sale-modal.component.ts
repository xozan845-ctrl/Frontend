import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import type { CatalogProduct } from '../../../products/public-api';
import { createCompanySaleLineId } from '../../constants/company-sales.constants';
import { CompanySalePaymentMethodsComponent } from '../company-sale-payment-methods/company-sale-payment-methods.component';
import type { CompanyClient } from '../../models/company-client.model';
import type { CompanyService } from '../../models/company-service.model';
import type {
  CompanySaleClientMode,
  CompanySaleLine,
  CompanySalePaymentMethod,
  CreateCompanySalePayload,
} from '../../models/company-sale.model';

const STEPS = [
  { value: 1, label: 'Cliente' },
  { value: 2, label: 'Productos' },
  { value: 3, label: 'Servicios' },
  { value: 4, label: 'Resumen' },
  { value: 5, label: 'Pago' },
  { value: 6, label: 'Observaciones' },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * Asistente de Nueva Venta (ADR-53). Recibe catálogo, clientes y servicios como
 * inputs y emite un payload puro; no conoce stores ni HTTP (`R-SO-8`).
 */
@Component({
  selector: 'app-company-new-sale-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppCurrencyPipe,
    FocusTrapDirective,
    CompanySalePaymentMethodsComponent,
  ],
  templateUrl: './company-new-sale-modal.component.html',
})
export class CompanyNewSaleModalComponent {
  readonly open = input(false);
  readonly clients = input<readonly CompanyClient[]>([]);
  readonly products = input<readonly CatalogProduct[]>([]);
  readonly services = input<readonly CompanyService[]>([]);
  readonly nextNumber = input('V-000001');
  readonly error = input<string | null>(null);
  readonly submitSale = output<CreateCompanySalePayload>();
  readonly dismiss = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly steps = STEPS;
  readonly step = signal(1);
  readonly maxVisited = signal(1);
  readonly clientMode = signal<CompanySaleClientMode>('final');
  readonly selectedClientId = signal<string | null>(null);
  readonly clientSearch = signal('');
  readonly productSearch = signal('');
  readonly serviceSearch = signal('');
  readonly lines = signal<CompanySaleLine[]>([]);
  readonly paymentMethod = signal<CompanySalePaymentMethod>('efectivo');
  readonly discountPercent = signal(0);
  readonly notes = signal('');
  readonly saleDate = signal(todayInput());
  readonly stepError = signal<string | null>(null);

  readonly quickForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    company: ['', [Validators.maxLength(100)]],
  });

  private readonly quickValue = toSignal(this.quickForm.valueChanges, {
    initialValue: this.quickForm.getRawValue(),
  });

  readonly quickName = computed(() => this.quickValue().name ?? '');
  readonly quickEmail = computed(() => this.quickValue().email ?? '');

  readonly filteredClients = computed(() => {
    const term = this.clientSearch().trim().toLocaleLowerCase('es');
    const clients = this.clients();
    if (!term) return clients.slice(0, 20);
    return clients
      .filter((client) =>
        `${client.name} ${client.phone} ${client.email} ${client.company}`
          .toLocaleLowerCase('es')
          .includes(term),
      )
      .slice(0, 20);
  });

  readonly selectedClient = computed(
    () => this.clients().find((client) => client.id === this.selectedClientId()) ?? null,
  );

  readonly filteredProducts = computed(() => {
    const term = this.productSearch().trim().toLocaleLowerCase('es');
    const products = this.products().filter((product) => product.status === 'disponible');
    if (!term) return products.slice(0, 12);
    return products
      .filter((product) =>
        `${product.name} ${product.sku} ${product.category}`.toLocaleLowerCase('es').includes(term),
      )
      .slice(0, 12);
  });

  readonly filteredServices = computed(() => {
    const term = this.serviceSearch().trim().toLocaleLowerCase('es');
    const services = this.services().filter((service) => service.status === 'activo');
    if (!term) return services.slice(0, 12);
    return services
      .filter((service) =>
        `${service.name} ${service.code} ${service.category}`
          .toLocaleLowerCase('es')
          .includes(term),
      )
      .slice(0, 12);
  });

  readonly clientName = computed(() => {
    if (this.clientMode() === 'final') return 'Consumidor final';
    if (this.clientMode() === 'existing') return this.selectedClient()?.name ?? '';
    return this.quickName().trim();
  });

  readonly hasItems = computed(() => this.lines().length > 0);
  readonly subtotal = computed(() =>
    toMoney(this.lines().reduce((sum, line) => sum + line.subtotal, 0)),
  );
  readonly discount = computed(() =>
    toMoney((this.subtotal() * Math.min(Math.max(this.discountPercent(), 0), 100)) / 100),
  );
  readonly total = computed(() => toMoney(this.subtotal() - this.discount()));
  readonly isLastStep = computed(() => this.step() >= STEPS.length);
  readonly canSubmit = computed(
    () =>
      this.hasItems() &&
      this.total() > 0 &&
      this.clientName().length > 0 &&
      this.saleDate().length > 0,
  );

  private readonly resetOnOpen = effect(() => {
    if (this.open()) this.reset();
  });

  reset(): void {
    this.step.set(1);
    this.maxVisited.set(1);
    this.clientMode.set('final');
    this.selectedClientId.set(null);
    this.clientSearch.set('');
    this.productSearch.set('');
    this.serviceSearch.set('');
    this.lines.set([]);
    this.paymentMethod.set('efectivo');
    this.discountPercent.set(0);
    this.notes.set('');
    this.saleDate.set(todayInput());
    this.stepError.set(null);
    this.quickForm.reset({ name: '', phone: '', email: '', company: '' });
  }

  selectClientMode(mode: CompanySaleClientMode): void {
    this.clientMode.set(mode);
    this.stepError.set(null);
    if (mode !== 'existing') this.selectedClientId.set(null);
  }

  chooseClient(client: CompanyClient): void {
    this.selectedClientId.set(client.id);
    this.clientMode.set('existing');
    this.stepError.set(null);
  }

  addProduct(product: CatalogProduct): void {
    this.addLine({
      kind: 'product',
      referenceId: product.id,
      code: product.sku,
      name: product.name,
      unitPrice: product.basePrice,
    });
  }

  addService(service: CompanyService): void {
    this.addLine({
      kind: 'service',
      referenceId: service.id,
      code: service.code,
      name: service.name,
      unitPrice: service.price,
    });
  }

  private addLine(input: {
    kind: 'product' | 'service';
    referenceId: string;
    code: string;
    name: string;
    unitPrice: number;
  }): void {
    const current = this.lines();
    const existing = current.find(
      (line) => line.kind === input.kind && line.referenceId === input.referenceId,
    );
    if (existing) {
      this.incrementLine(existing.id);
      return;
    }

    const line: CompanySaleLine = {
      id: createCompanySaleLineId(),
      kind: input.kind,
      referenceId: input.referenceId,
      code: input.code,
      name: input.name,
      quantity: 1,
      unitPrice: toMoney(input.unitPrice),
      subtotal: toMoney(input.unitPrice),
    };
    this.lines.set([...current, line]);
    this.stepError.set(null);
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

  setDiscount(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.discountPercent.set(Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0);
  }

  setClientSearch(event: Event): void {
    this.clientSearch.set((event.target as HTMLInputElement).value);
  }

  setProductSearch(event: Event): void {
    this.productSearch.set((event.target as HTMLInputElement).value);
  }

  setServiceSearch(event: Event): void {
    this.serviceSearch.set((event.target as HTMLInputElement).value);
  }

  setSaleDate(event: Event): void {
    this.saleDate.set((event.target as HTMLInputElement).value);
  }

  setNotes(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  goToStep(step: number): void {
    if (step <= this.maxVisited()) {
      this.step.set(step);
      this.stepError.set(null);
    }
  }

  previous(): void {
    if (this.step() > 1) {
      this.step.set(this.step() - 1);
      this.stepError.set(null);
    }
  }

  next(): void {
    if (!this.validateCurrentStep()) return;
    if (this.isLastStep()) {
      this.submit();
      return;
    }
    const next = this.step() + 1;
    this.step.set(next);
    this.maxVisited.set(Math.max(this.maxVisited(), next));
    this.stepError.set(null);
  }

  submit(): void {
    if (!this.validateCurrentStep() || !this.canSubmit()) {
      if (this.total() <= 0) {
        this.stepError.set('El total de la venta debe ser mayor que cero.');
      }
      return;
    }

    const quick = this.quickForm.getRawValue();
    const selected = this.selectedClient();
    this.submitSale.emit({
      client:
        this.clientMode() === 'existing' && selected
          ? {
              mode: 'existing',
              clientId: selected.id,
              name: selected.name,
              phone: selected.phone,
              email: selected.email,
              company: selected.company,
            }
          : this.clientMode() === 'quick'
            ? {
                mode: 'quick',
                name: quick.name.trim(),
                phone: quick.phone.trim(),
                email: quick.email.trim(),
                company: quick.company.trim(),
              }
            : { mode: 'final', name: 'Consumidor final' },
      lines: this.lines(),
      paymentMethod: this.paymentMethod(),
      date: this.saleDate(),
      discountPercent: this.discountPercent(),
      notes: this.notes().trim(),
    });
  }

  private validateCurrentStep(): boolean {
    if (this.step() === 1 && this.clientMode() === 'quick') {
      const quick = this.quickForm.getRawValue();
      if (quick.name.trim().length < 2) {
        this.stepError.set('Escribe al menos 2 caracteres en el nombre del cliente.');
        return false;
      }
      if (quick.email.trim() && !EMAIL_PATTERN.test(quick.email.trim())) {
        this.stepError.set('El correo del cliente no es válido.');
        return false;
      }
    }
    if (this.step() === 1 && !this.clientName().trim()) {
      this.stepError.set('Selecciona un cliente o escribe el nombre del cliente rápido.');
      return false;
    }
    if (this.step() === 3 && !this.hasItems()) {
      this.stepError.set('Agrega al menos un producto o servicio para continuar.');
      return false;
    }
    if (this.step() === 5 && !this.saleDate()) {
      this.stepError.set('Indica la fecha de la venta.');
      return false;
    }
    return true;
  }

  stepClass(value: number): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40';
    if (this.step() === value) return `${base} bg-accent-600 text-white shadow-sm`;
    if (value <= this.maxVisited()) {
      return `${base} text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-white`;
    }
    return `${base} text-slate-400 dark:text-slate-500`;
  }

  clientModeClass(mode: CompanySaleClientMode): string {
    const base =
      'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors';
    return this.clientMode() === mode
      ? `${base} border-accent-600 bg-accent-50 text-accent-700 dark:border-accent-500 dark:bg-accent-900/20 dark:text-accent-300`
      : `${base} border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-300 dark:hover:border-surface-500`;
  }

  lineIcon(line: CompanySaleLine): string {
    return line.kind === 'service' ? 'fa-solid fa-screwdriver-wrench' : 'fa-solid fa-cube';
  }

  clientRowClass(id: string): string {
    const base =
      'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs transition-colors';
    return this.selectedClientId() === id
      ? `${base} border-accent-600 bg-accent-50 dark:border-accent-500 dark:bg-accent-900/20`
      : `${base} border-slate-200 bg-white hover:border-slate-300 dark:border-surface-600 dark:bg-surface-800 dark:hover:border-surface-500`;
  }
}
