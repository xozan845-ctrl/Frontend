import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
  PURCHASE_PAYMENT_METHODS,
  PURCHASE_PERIODS,
  buildPurchaseReport,
  buildPurchaseReportHtml,
  purchaseReportCsv,
  type PurchaseDocumentSettings,
  type PurchasePaymentMethod,
  type PurchasePeriod,
  type PurchaseRecord,
  type Supplier,
} from '../../../../domains/purchases/public-api';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';

/** Panel de exportación con filtros, resumen y descarga Excel/PDF. */
@Component({
  selector: 'app-purchase-export-modal',
  standalone: true,
  imports: [AppCurrencyPipe, FocusTrapDirective],
  templateUrl: './purchase-export-modal.component.html',
})
export class PurchaseExportModalComponent {
  readonly open = input.required<boolean>();
  readonly records = input.required<readonly PurchaseRecord[]>();
  readonly suppliers = input.required<readonly Supplier[]>();
  readonly settings = input.required<PurchaseDocumentSettings>();
  readonly companyName = input.required<string>();

  readonly dismiss = output<void>();

  readonly periods = PURCHASE_PERIODS;
  readonly payments = PURCHASE_PAYMENT_METHODS;

  readonly period = signal<PurchasePeriod>('mes');
  readonly customFrom = signal('');
  readonly customTo = signal('');
  readonly status = signal<'activas' | 'anuladas' | 'todas'>('activas');
  readonly type = signal<'todas' | 'productos' | 'directas'>('todas');
  readonly payment = signal<'todas' | PurchasePaymentMethod>('todas');
  readonly includeProducts = signal(true);
  readonly supplierQuery = signal('');
  readonly selectedSupplierIds = signal<readonly string[]>([]);

  readonly supplierOptions = computed(() => {
    const query = this.supplierQuery().trim().toLowerCase();
    if (!query) return this.suppliers();
    return this.suppliers().filter((supplier) => supplier.name.toLowerCase().includes(query));
  });

  readonly report = computed(() =>
    buildPurchaseReport(this.records(), {
      period: this.period(),
      customFrom: this.customFrom(),
      customTo: this.customTo(),
      status: this.status(),
      type: this.type(),
      payment: this.payment(),
      includeProducts: this.includeProducts(),
      supplierIds: this.selectedSupplierIds(),
    }),
  );

  readonly selectedSupplierNames = computed(() => {
    const ids = new Set(this.selectedSupplierIds());
    return this.suppliers()
      .filter((supplier) => ids.has(supplier.id))
      .map((supplier) => supplier.name);
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.period.set('mes');
    this.customFrom.set('');
    this.customTo.set('');
    this.status.set('activas');
    this.type.set('todas');
    this.payment.set('todas');
    this.includeProducts.set(true);
    this.supplierQuery.set('');
    this.selectedSupplierIds.set([]);
  });

  setPeriod(event: Event): void {
    this.period.set((event.target as HTMLSelectElement).value as PurchasePeriod);
  }

  setCustomFrom(event: Event): void {
    this.customFrom.set((event.target as HTMLInputElement).value);
    this.period.set('personalizado');
  }

  setCustomTo(event: Event): void {
    this.customTo.set((event.target as HTMLInputElement).value);
    this.period.set('personalizado');
  }

  setStatus(value: 'activas' | 'anuladas' | 'todas'): void {
    this.status.set(value);
  }

  setType(value: 'todas' | 'productos' | 'directas'): void {
    this.type.set(value);
  }

  setPayment(event: Event): void {
    this.payment.set((event.target as HTMLSelectElement).value as 'todas' | PurchasePaymentMethod);
  }

  setIncludeProducts(value: boolean): void {
    this.includeProducts.set(value);
  }

  setSupplierQuery(event: Event): void {
    this.supplierQuery.set((event.target as HTMLInputElement).value);
  }

  toggleSupplier(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedSupplierIds();
    this.selectedSupplierIds.set(
      checked
        ? [...current.filter((item) => item !== id), id]
        : current.filter((item) => item !== id),
    );
  }

  clearSuppliers(): void {
    this.selectedSupplierIds.set([]);
  }

  exportExcel(): void {
    const report = this.report();
    if (report.count === 0) return;
    const csv = purchaseReportCsv(report, this.includeProducts());
    this.download(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `reporte-compras-${this.period()}.csv`,
    );
  }

  exportPdf(): void {
    const report = this.report();
    if (report.count === 0) return;
    const html = buildPurchaseReportHtml(report, this.settings(), this.companyName(), {
      period: this.period(),
      customFrom: this.customFrom(),
      customTo: this.customTo(),
      status: this.status(),
      type: this.type(),
      payment: this.payment(),
      includeProducts: this.includeProducts(),
      supplierIds: this.selectedSupplierIds(),
    });
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.download(
        new Blob([html], { type: 'text/html;charset=utf-8' }),
        `reporte-compras-${this.period()}.html`,
      );
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
