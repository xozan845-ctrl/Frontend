import { Component, computed, effect, inject, signal } from '@angular/core';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import {
  CompanyStore,
  CompanyProductsStore,
  type CompanyCatalogFormValue,
} from '../../../../applications/empresas/public-api';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  PurchasesStore,
  type CreateDirectPurchaseInput,
  type CreateNewProductPurchaseInput,
  type CreateOrderInput,
  type CreatePurchaseInput,
  type CreateSupplierInput,
  purchaseToday,
  type PurchaseDocumentSettings,
  type PurchaseProductOption,
} from '../../../../domains/purchases/public-api';
import { PurchaseCustomizeModalComponent } from '../../components/purchase-customize-modal/purchase-customize-modal.component';
import { PurchaseDirectModalComponent } from '../../components/purchase-direct-modal/purchase-direct-modal.component';
import { PurchaseExportModalComponent } from '../../components/purchase-export-modal/purchase-export-modal.component';
import { PurchaseHistoryComponent } from '../../components/purchase-history/purchase-history.component';
import { PurchaseKpiGridComponent } from '../../components/purchase-kpi-grid/purchase-kpi-grid.component';
import { PurchaseNewModalComponent } from '../../components/purchase-new-modal/purchase-new-modal.component';
import { PurchaseOrdersComponent } from '../../components/purchase-orders/purchase-orders.component';
import { PurchaseSupplierModalComponent } from '../../components/purchase-supplier-modal/purchase-supplier-modal.component';
import { PurchaseSuppliersComponent } from '../../components/purchase-suppliers/purchase-suppliers.component';
import type { NewPurchaseMode, PurchasesTab, PurchasesView } from './company-purchases.types';

/**
 * Centro de compras de la empresa (ADR-66): historial, proveedores, órdenes,
 * compra directa, personalización de documentos y exportación. La página solo
 * orquesta el store; los derivados viven en `withComputed` (`R-ST-3`).
 */
@Component({
  selector: 'app-company-purchases',
  standalone: true,
  imports: [
    PurchaseKpiGridComponent,
    PurchaseHistoryComponent,
    PurchaseSuppliersComponent,
    PurchaseOrdersComponent,
    PurchaseCustomizeModalComponent,
    PurchaseExportModalComponent,
    PurchaseDirectModalComponent,
    PurchaseNewModalComponent,
    PurchaseSupplierModalComponent,
  ],
  templateUrl: './company-purchases.component.html',
})
export default class CompanyPurchasesComponent {
  readonly purchases = inject(PurchasesStore);
  readonly products = inject(CompanyProductsStore);
  private readonly company = inject(CompanyStore);
  private readonly auth = inject(AuthStore);
  private readonly notification = inject(NotificationService);

  readonly greeting = buildGreeting(this.auth.user()?.name);
  readonly companyName = computed(() => this.company.company()?.name ?? 'Mi Empresa');
  readonly productOptions = computed(
    () => this.products.rows() as readonly PurchaseProductOption[],
  );

  readonly view = signal<PurchasesView>('history');
  readonly tab = signal<PurchasesTab>('history');

  readonly customizeOpen = signal(false);
  readonly exportOpen = signal(false);
  readonly directOpen = signal(false);
  readonly newOpen = signal(false);
  readonly newMode = signal<NewPurchaseMode>('compra');
  readonly supplierModalOpen = signal(false);

  readonly directError = signal<string | null>(null);
  readonly newError = signal<string | null>(null);
  readonly supplierError = signal<string | null>(null);

  private readonly loadProducts = this.products.load();

  /** Carga la ficha de la empresa para usar su nombre en los documentos. */
  private readonly loadCompany = effect(() => {
    const tenantId = this.auth.user()?.tenantId;
    if (tenantId && !this.company.company()) this.company.load(tenantId);
  });

  private readonly seoService = injectSeoPage(
    'Compras — Empresa',
    'Abastece tu inventario y controla tus compras a proveedores.',
  );

  setView(view: PurchasesView): void {
    this.view.set(view);
  }

  setTab(tab: PurchasesTab): void {
    this.tab.set(tab);
  }

  tabClass(tab: PurchasesTab): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors';
    return this.tab() === tab
      ? `${base} border-accent-600 bg-accent-600 text-white shadow-sm`
      : `${base} border-slate-200 text-slate-600 hover:border-accent-400 hover:text-accent-600 dark:border-surface-600 dark:text-slate-300`;
  }

  openCustomize(): void {
    this.customizeOpen.set(true);
  }

  closeCustomize(): void {
    this.customizeOpen.set(false);
  }

  saveSettings(settings: PurchaseDocumentSettings): void {
    this.purchases.updateDocumentSettings(settings);
    this.customizeOpen.set(false);
  }

  openExport(): void {
    this.exportOpen.set(true);
  }

  closeExport(): void {
    this.exportOpen.set(false);
  }

  openDirect(): void {
    this.directError.set(null);
    this.directOpen.set(true);
  }

  closeDirect(): void {
    this.directOpen.set(false);
  }

  openNew(mode: NewPurchaseMode): void {
    this.newError.set(null);
    this.newMode.set(mode);
    this.newOpen.set(true);
  }

  closeNew(): void {
    this.newOpen.set(false);
  }

  openSupplierModal(): void {
    this.supplierError.set(null);
    this.supplierModalOpen.set(true);
  }

  closeSupplierModal(): void {
    this.supplierModalOpen.set(false);
  }

  submitPurchase(payload: CreatePurchaseInput): void {
    const result = this.purchases.addPurchase({
      ...payload,
      userName: this.auth.user()?.name ?? '',
    });
    if (!result.ok) {
      this.newError.set(result.message ?? 'No se pudo registrar la compra.');
      return;
    }
    this.newError.set(null);
    this.newOpen.set(false);
    this.view.set('history');
    this.tab.set('history');
  }

  submitOrder(payload: CreateOrderInput): void {
    const result = this.purchases.addOrder(payload);
    if (!result.ok) {
      this.newError.set(result.message ?? 'No se pudo crear la orden.');
      return;
    }
    this.newError.set(null);
    this.newOpen.set(false);
    this.view.set('orders');
  }

  submitDirect(payload: CreateDirectPurchaseInput): void {
    const result = this.purchases.addDirectPurchase({
      ...payload,
      userName: this.auth.user()?.name ?? '',
    });
    if (!result.ok) {
      this.directError.set(result.message ?? 'No se pudo registrar la compra directa.');
      return;
    }
    this.directError.set(null);
    this.directOpen.set(false);
    this.view.set('history');
    this.tab.set('history');
  }

  submitNewProduct(payload: CreateNewProductPurchaseInput): void {
    const result = this.purchases.addNewProductPurchase({
      ...payload,
      userName: this.auth.user()?.name ?? '',
    });
    if (!result.ok) {
      this.newError.set(result.message ?? 'No se pudo registrar la compra del producto.');
      return;
    }
    this.newError.set(null);
    this.newOpen.set(false);
    this.view.set('history');
    this.tab.set('history');

    const sku = (payload.sku ?? '').trim() || `SKU-${Date.now().toString(36).toUpperCase()}`;
    this.products.create(this.toCatalogForm(payload, sku));
  }

  private toCatalogForm(
    payload: CreateNewProductPurchaseInput,
    sku: string,
  ): CompanyCatalogFormValue {
    return {
      type: 'producto',
      name: payload.productName,
      description: '',
      category: payload.category ?? '',
      code: sku,
      brand: '',
      barcode: '',
      cost: payload.unitCost.toFixed(2),
      price: payload.salePrice.toFixed(2),
      unit: 'Unidad (u)',
      allowFractions: false,
      purchaseUnit: 'Igual que la de venta',
      contentAmount: 0,
      contentUnit: 'Sin contenido',
      priceType: 'fijo',
      costType: 'fijo',
      stock: payload.quantity,
      minStock: 0,
      maxStock: null,
      warrantyMonths: null,
      isRawMaterial: false,
      location: '',
      status: 'activo',
      createdAt: purchaseToday(),
      durationMinutes: 60,
    };
  }

  addSupplier(name: string): void {
    const result = this.purchases.addSupplier({ name });
    if (!result.ok) {
      this.notification.showError(result.message ?? 'No se pudo registrar el proveedor.');
    }
  }

  saveSupplier(payload: CreateSupplierInput): void {
    const result = this.purchases.addSupplier(payload);
    if (!result.ok) {
      this.supplierError.set(result.message ?? 'No se pudo registrar el proveedor.');
      return;
    }
    this.supplierError.set(null);
    this.supplierModalOpen.set(false);
  }

  removePurchase(id: string): void {
    this.purchases.removePurchase(id);
  }

  cancelPurchase(id: string): void {
    this.purchases.cancelPurchase(id);
  }

  convertOrder(id: string): void {
    this.purchases.convertOrderToPurchase(id);
  }

  cancelOrder(id: string): void {
    this.purchases.cancelOrder(id);
  }
}

function buildGreeting(name?: string | null): string {
  const firstName = name?.trim().split(/\s+/)[0] ?? '';
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return firstName ? `${prefix}, ${firstName}` : prefix;
}
