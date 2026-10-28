import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { REPORTS_SCOPE_CONFIG } from '../../../../../shared/reports/constants/reports-config.tokens';
import type { ReportsScopeConfig } from '../../../../../shared/reports/models/reports-config.model';
import { ReportsStore, type ReportSnapshot } from '../../../../reports/public-api';
import ReportsComponent from './reports.component';

const config: ReportsScopeConfig = {
  scope: 'company',
  title: 'Reportes',
  subtitle: 'Consolidado de ventas',
};

const snapshot: ReportSnapshot = {
  totalSales: 300,
  ordersCount: 2,
  averageTicket: 150,
  days: [{ date: '2026-10-28', total: 300, count: 2 }],
  statuses: [{ status: 'pagada', total: 300, count: 2 }],
};

describe('ReportsComponent', () => {
  const store = {
    snapshot: signal(snapshot),
    loading: signal(false),
    recentDays: signal(snapshot.days),
    hasData: signal(true),
    load: vi.fn(),
  };

  const setup = async (loading = false, hasData = true) => {
    store.loading.set(loading);
    store.hasData.set(hasData);
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        { provide: ReportsStore, useValue: store },
        { provide: REPORTS_SCOPE_CONFIG, useValue: config },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar KPIs, días y estados', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Reportes');
    expect(host.textContent).toContain('C$300.00');
    expect(host.textContent).toContain('pagada');
    expect(host.querySelector('[data-testid="reports-days-table"]')).not.toBeNull();
    expect(store.load).toHaveBeenCalled();
  });

  it('debe mostrar el estado de carga', async () => {
    const fixture = await setup(true);

    expect(fixture.nativeElement.textContent).toContain('Cargando reporte');
  });

  it('debe mostrar el vacío sin ventas', async () => {
    const fixture = await setup(false, false);

    expect(fixture.nativeElement.textContent).toContain('No hay ventas registradas');
  });
});
