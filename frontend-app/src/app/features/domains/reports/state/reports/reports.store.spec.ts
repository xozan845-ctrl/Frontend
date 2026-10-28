import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { REPORTS_DATA_SOURCE } from '../../repositories/reports-source.repository';
import type { ReportSnapshot } from '../../models/report.model';
import { ReportsStore } from './reports.store';

const SNAPSHOT: ReportSnapshot = {
  totalSales: 300,
  ordersCount: 2,
  averageTicket: 150,
  days: [{ date: '2026-10-28', total: 300, count: 2 }],
  statuses: [{ status: 'pagada', total: 300, count: 2 }],
};

describe('ReportsStore', () => {
  const snapshot = signal(SNAPSHOT);
  const loading = signal(false);
  const source = {
    snapshot: computed(() => snapshot()),
    loading: computed(() => loading()),
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
    TestBed.resetTestingModule();
  });

  it('debe exponer snapshot, carga y días recientes', () => {
    const store = setup();

    expect(store.snapshot()).toEqual(SNAPSHOT);
    expect(store.loading()).toBe(false);
    expect(store.recentDays()).toHaveLength(1);
    expect(store.hasData()).toBe(true);
  });

  it('debe delegar la carga en la fuente', () => {
    const store = setup();

    store.load();

    expect(source.load).toHaveBeenCalledTimes(1);
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
