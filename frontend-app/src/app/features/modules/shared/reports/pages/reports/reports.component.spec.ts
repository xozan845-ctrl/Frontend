import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '@core/services/seo/seo.service';
import { REPORTS_SCOPE_CONFIG } from '@shared/reports/constants/reports-config.tokens';
import type { ReportsScopeConfig } from '@shared/reports/models/reports-config.model';
import { ReportsStore, type ReportSnapshot } from '@domains/reports/public-api';
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

interface ComponentState {
  loading?: boolean;
  hasData?: boolean;
  error?: string | null;
  hasStaleData?: boolean;
  lastUpdatedAt?: Date | null;
}

describe('ReportsComponent', () => {
  const store = {
    snapshot: signal(snapshot),
    loading: signal(false),
    error: signal<string | null>(null),
    lastUpdatedAt: signal<Date | null>(null),
    hasStaleData: signal(false),
    recentDays: signal(snapshot.days),
    hasData: signal(true),
    load: vi.fn(),
  };

  const setup = async (state: ComponentState = {}) => {
    store.loading.set(state.loading ?? false);
    store.hasData.set(state.hasData ?? true);
    store.error.set(state.error ?? null);
    store.hasStaleData.set(state.hasStaleData ?? false);
    store.lastUpdatedAt.set(state.lastUpdatedAt ?? null);
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
    const fixture = await setup({ loading: true, hasData: false });

    expect(fixture.nativeElement.textContent).toContain('Cargando reporte');
  });

  it('debe mostrar el vacío sin ventas', async () => {
    const fixture = await setup({ hasData: false });

    expect(fixture.nativeElement.textContent).toContain('No hay ventas registradas');
  });

  // regression: F12
  it('debe mostrar el error y reintentar sin pintar KPIs en cero', async () => {
    const fixture = await setup({
      hasData: false,
      error: 'No se pudieron cargar los reportes de la empresa.',
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="reports-error"]')).not.toBeNull();
    expect(host.textContent).toContain('No se pudieron cargar los reportes de la empresa.');
    expect(host.querySelector('[data-testid="reports-kpi-sales"]')).toBeNull();
    expect(host.textContent).not.toContain('No hay ventas registradas');

    host.querySelector<HTMLButtonElement>('[data-testid="reports-retry"]')?.click();

    expect(store.load).toHaveBeenCalledTimes(2);
  });

  // regression: F12
  it('debe avisar que muestra el último dato válido si falla la recarga', async () => {
    const fixture = await setup({
      error: 'sin red',
      hasStaleData: true,
      lastUpdatedAt: new Date('2026-11-24T10:30:00.000Z'),
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="reports-stale"]')).not.toBeNull();
    expect(host.textContent).toContain('Mostrando el último reporte disponible');
    expect(host.querySelector('[data-testid="reports-kpi-sales"]')).not.toBeNull();
  });
});
