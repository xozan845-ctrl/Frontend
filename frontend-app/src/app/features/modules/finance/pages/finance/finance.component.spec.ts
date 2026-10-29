import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { BANKS_SCOPE_CONFIG } from '../../../../../shared/banks/constants/banks-config.tokens';
import { AuthStore } from '../../../../applications/auth/public-api';
import { CompanySalesStore } from '../../../../applications/empresas/public-api';
import { BanksStore } from '../../../../domains/banks/public-api';
import { FinanceStore, cashToday } from '../../../../domains/finance/public-api';
import FinanceComponent from './finance.component';

describe('FinanceComponent', () => {
  const authStore = {
    user: computed(() => ({ id: 'u-1', name: 'Karla López', tenantId: 'tenant-1' })),
  };
  const salesStore = {
    rows: signal([]),
    loadOrders: vi.fn(),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceComponent],
      providers: [
        provideRouter([]),
        FinanceStore,
        BanksStore,
        {
          provide: BANKS_SCOPE_CONFIG,
          useValue: { scope: 'company', storageScope: 'company', title: 'Bancos', subtitle: '' },
        },
        { provide: AuthStore, useValue: authStore },
        { provide: CompanySalesStore, useValue: salesStore },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FinanceComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe renderizar el saludo, los KPIs y las secciones', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Karla');
    expect(host.textContent).toContain('Caja disponible');
    expect(host.textContent).toContain('Ingresos del mes');
    expect(host.querySelector('[data-testid="cash-section-tabs"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="cash-movements-panel"]')).not.toBeNull();
    expect(salesStore.loadOrders).toHaveBeenCalled();
  });

  it('debe cambiar entre las secciones de caja', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="cash-section-methods"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="payment-methods-panel"]')).not.toBeNull();

    (host.querySelector('[data-testid="cash-section-closures"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="cash-closures-panel"]')).not.toBeNull();

    (host.querySelector('[data-testid="cash-section-petty"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="petty-cash-panel"]')).not.toBeNull();
  });

  it('debe delegar el alta y la anulación de movimientos en el store', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.openMovement();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="cash-movement-dialog"]'),
    ).not.toBeNull();

    component.saveMovement({
      date: cashToday(),
      type: 'ingreso',
      category: 'aporte',
      concept: 'Aporte de socio',
      amount: 500,
      paymentMethod: 'efectivo',
    });
    fixture.detectChanges();

    expect(component.finance.cash()).toHaveLength(1);
    expect(component.finance.cashKpis().available).toBe(500);
    expect(notification.showError).not.toHaveBeenCalled();

    component.annulMovement(component.finance.cash()[0].id);
    expect(component.finance.cash()[0].status).toBe('anulado');
    expect(component.finance.cashKpis().available).toBe(0);
  });

  it('debe abrir el reporte de caja y reflejar los movimientos', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="cash-export"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="cash-export-dialog"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="cash-export-summary"]')?.textContent).toContain(
      '0 movimientos',
    );
  });
});
