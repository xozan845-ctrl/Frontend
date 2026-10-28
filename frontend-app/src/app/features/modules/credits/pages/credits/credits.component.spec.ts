import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { CREDITS_SCOPE_CONFIG } from '../../../../../shared/credits/constants/credits-config.tokens';
import type { CreditsScopeConfig } from '../../../../../shared/credits/models/credits-config.model';
import { CreditsStore, type CreditRow } from '../../../../credits/public-api';
import CreditsComponent from './credits.component';

const config: CreditsScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Créditos',
  subtitle: 'Créditos de la empresa',
};

const row: CreditRow = {
  id: 'credit-1',
  customer: 'Carla',
  concept: 'Pedido',
  date: '2026-10-01',
  dueDate: '2026-10-20',
  amount: 500,
  balance: 500,
  overdue: true,
  paid: false,
};

describe('CreditsComponent', () => {
  const store = {
    records: signal([row]),
    rows: signal([row]),
    summary: signal({
      outstandingTotal: 500,
      overdueTotal: 500,
      collectedTotal: 0,
      activeCount: 1,
    }),
    hasRecords: signal(true),
    addCredit: vi.fn((): { ok: boolean; message?: string } => ({ ok: true })),
    markPaid: vi.fn(),
    removeCredit: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CreditsComponent],
      providers: [
        { provide: CreditsStore, useValue: store },
        { provide: CREDITS_SCOPE_CONFIG, useValue: config },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreditsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar KPIs, estado y créditos', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Créditos');
    expect(host.textContent).toContain('Carla');
    expect(host.textContent).toContain('Vencido');
    expect(host.textContent).toContain('C$500.00');
    expect(host.querySelector('[data-testid="credits-table"]')).not.toBeNull();
  });

  it('debe registrar un crédito y limpiar el error', async () => {
    const fixture = await setup();

    fixture.componentInstance.addCredit({
      customer: 'Carla',
      concept: 'Pedido',
      dueDate: '2026-11-01',
      amount: 500,
    });

    expect(store.addCredit).toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('debe mostrar el error del store y delegar acciones', async () => {
    const fixture = await setup();
    store.addCredit.mockReturnValueOnce({ ok: false, message: 'Límite alcanzado' });
    const host = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.addCredit({
      customer: 'Carla',
      concept: 'Pedido',
      dueDate: '2026-11-01',
      amount: 500,
    });
    fixture.detectChanges();
    (host.querySelector('[data-testid="credit-mark-paid"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="credit-remove"]') as HTMLButtonElement).click();

    expect(fixture.componentInstance.error()).toBe('Límite alcanzado');
    expect(store.markPaid).toHaveBeenCalledWith('credit-1');
    expect(store.removeCredit).toHaveBeenCalledWith('credit-1');
  });
});
