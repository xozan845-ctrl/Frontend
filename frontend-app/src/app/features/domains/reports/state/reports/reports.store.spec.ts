import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { REPORTS_DATA_SOURCE } from '../../repositories/reports-source/reports-source.repository';
import type { ReportSnapshot } from '../../models/report.model';
import { ReportsStore } from './reports.store';

const SNAPSHOT: ReportSnapshot = {
  totalSales: 300,
  ordersCount: 2,
  averageTicket: 150,
  days: [{ date: '2026-10-28', total: 300, count: 2 }],
  statuses: [{ status: 'pagada', total: 300, count: 2 }],
};

const UPDATED_AT = new Date('2026-11-24T10:30:00.000Z');

describe('ReportsStore', () => {
  const snapshot = signal(SNAPSHOT);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const lastUpdatedAt = signal<Date | null>(UPDATED_AT);
  const source = {
    snapshot: computed(() => snapshot()),
    loading: computed(() => loading()),
    error: computed(() => error()),
    lastUpdatedAt: computed(() => lastUpdatedAt()),
    load: vi.fn(),
  };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [ReportsStore, { provide: REPORTS_DATA_SOURCE, useValue: source }],
    });
    return TestBed.inject(ReportsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    snapshot.set(SNAPSHOT);
    loading.set(false);
    error.set(null);
    lastUpdatedAt.set(UPDATED_AT);
    TestBed.resetTestingModule();
  });

  it('debe exponer snapshot, carga, error y días recientes', () => {
    const store = setup();

    expect(store.snapshot()).toEqual(SNAPSHOT);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.lastUpdatedAt()).toEqual(UPDATED_AT);
    expect(store.recentDays()).toHaveLength(1);
    expect(store.hasData()).toBe(true);
    expect(store.hasStaleData()).toBe(false);
  });

  it('debe delegar la carga en la fuente', () => {
    const store = setup();

    store.load();

    expect(source.load).toHaveBeenCalledTimes(1);
  });

  // regression: F12
  it('debe marcar dato desactualizado cuando hay error y datos previos', () => {
    error.set('sin red');
    const store = setup();

    expect(store.error()).toBe('sin red');
    expect(store.hasStaleData()).toBe(true);
  });

  it('no debe marcar dato desactualizado si el fallo no dejó datos', () => {
    snapshot.set({ ...SNAPSHOT, ordersCount: 0, totalSales: 0, days: [], statuses: [] });
    error.set('sin red');
    const store = setup();

    expect(store.hasStaleData()).toBe(false);
  });

  it('debe reflejar una fuente vacía', () => {
    snapshot.set({ ...SNAPSHOT, ordersCount: 0, totalSales: 0, days: [], statuses: [] });
    const store = setup();

    expect(store.hasData()).toBe(false);
    expect(store.recentDays()).toEqual([]);
  });

  it('debe limitar los días recientes a 14', () => {
    snapshot.set({
      ...SNAPSHOT,
      days: Array.from({ length: 20 }, (_, index) => ({
        date: `2026-10-${String(index + 1).padStart(2, '0')}`,
        total: 10,
        count: 1,
      })),
    });
    const store = setup();

    expect(store.recentDays()).toHaveLength(14);
  });
});
