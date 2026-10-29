import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  COMPANY_REPOSITORY,
  CompanyProductsStore,
  CompanyStore,
} from '../../../../applications/empresas/public-api';
import { CATALOG_PRODUCT_REPOSITORY } from '../../../../applications/products/public-api';
import { PurchasesStore } from '../../../../domains/purchases/public-api';
import CompanyPurchasesComponent from './company-purchases.component';

describe('CompanyPurchasesComponent', () => {
  const user = signal({ id: 'u-1', name: 'Karla' });
  const authStore = { user: computed(() => user()) };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const catalogRepo = {
    list: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 100, pages: 0 })),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const companyRepo = {
    getById: vi.fn(),
    create: vi.fn(),
    updateLogistics: vi.fn(),
    createSeller: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyPurchasesComponent],
      providers: [
        PurchasesStore,
        CompanyProductsStore,
        CompanyStore,
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: catalogRepo },
        { provide: COMPANY_REPOSITORY, useValue: companyRepo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyPurchasesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('muestra el saludo, KPIs, historial y permite cambiar de vista', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="company-purchases-page"]')).not.toBeNull();
    expect(host.textContent).toContain('Karla');
    expect(host.querySelector('app-purchase-kpi-grid')).not.toBeNull();
    expect(host.querySelector('[data-testid="purchase-history-empty"]')).not.toBeNull();

    (host.querySelector('[data-testid="purchase-action-orders"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="purchase-orders-table"]')).not.toBeNull();

    (host.querySelector('[data-testid="purchase-orders-back"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="purchase-history-empty"]')).not.toBeNull();
  });

  it('abre el asistente de nueva compra y la compra directa', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="purchase-action-new"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="purchase-new-dialog"]')).not.toBeNull();

    (host.querySelector('[data-testid="purchase-new-close"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (host.querySelector('[data-testid="purchase-action-direct"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="purchase-direct-dialog"]')).not.toBeNull();
  });

  it('abre personalización, exportación y proveedores', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="purchase-action-customize"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="purchase-customize-dialog"]')).not.toBeNull();

    (host.querySelector('[data-testid="purchase-action-export"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="purchase-export-dialog"]')).not.toBeNull();

    (host.querySelector('[data-testid="purchase-tab-suppliers"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="purchase-suppliers-empty"]')).not.toBeNull();
  });
});
