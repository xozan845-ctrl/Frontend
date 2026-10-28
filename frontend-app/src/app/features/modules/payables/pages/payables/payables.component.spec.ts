import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { PAYABLES_SCOPE_CONFIG } from '../../../../../shared/payables/constants/payables-config.tokens';
import type { PayablesScopeConfig } from '../../../../../shared/payables/models/payables-config.model';
import { PayablesStore, type PayableRow } from '../../../../payables/public-api';
import PayablesComponent from './payables.component';

const config: PayablesScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Cuentas por pagar',
  subtitle: 'Obligaciones de la empresa',
};

const row: PayableRow = {
  id: 'payable-1',
  supplier: 'Proveedor',
  concept: 'Factura',
  dueDate: '2026-10-20',
  amount: 100,
  status: 'pendiente',
  paidAt: '',
  overdue: true,
};

describe('PayablesComponent', () => {
  const store = {
    records: signal([row]),
    rows: signal([row]),
    summary: signal({
      pendingTotal: 100,
      overdueTotal: 100,
      paidTotal: 0,
      pendingCount: 1,
    }),
    hasRecords: signal(true),
    addPayable: vi.fn(),
    markPaid: vi.fn(),
    removePayable: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PayablesComponent],
      providers: [
        { provide: PayablesStore, useValue: store },
        { provide: PAYABLES_SCOPE_CONFIG, useValue: config },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PayablesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar la configuración, los KPIs y las cuentas', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Cuentas por pagar');
    expect(host.textContent).toContain('Obligaciones de la empresa');
    expect(host.textContent).toContain('C$100.00');
    expect(host.textContent).toContain('Vencida');
    expect(host.querySelector('[data-testid="payables-table"]')).not.toBeNull();
  });

  it('debe delegar el alta en el store', async () => {
    const fixture = await setup();

    fixture.componentInstance.create({
      supplier: 'Proveedor',
      concept: 'Factura',
      dueDate: '2026-11-01',
      amount: 100,
    });

    expect(store.addPayable).toHaveBeenCalledWith({
      supplier: 'Proveedor',
      concept: 'Factura',
      dueDate: '2026-11-01',
      amount: 100,
    });
  });

  it('debe delegar el pago y el borrado desde la tabla', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="payable-mark-paid"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="payable-remove"]') as HTMLButtonElement).click();

    expect(store.markPaid).toHaveBeenCalledWith('payable-1');
    expect(store.removePayable).toHaveBeenCalledWith('payable-1');
  });
});
