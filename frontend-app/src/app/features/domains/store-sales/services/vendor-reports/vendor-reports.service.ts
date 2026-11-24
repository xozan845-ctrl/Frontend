import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  ReportEntry,
  ReportsDataSource,
  ReportsReadResult,
  ReportsSourcePort,
} from '@domains/reports/public-api';
import { buildReportSnapshot } from '@domains/reports/public-api';
import { VENDOR_ORDER_REPOSITORY } from '../../repositories/vendor-order.repository';

/** Fuente de reportes de la tienda sobre los pedidos del vendedor. */
@Injectable()
export class VendorReportsSource implements ReportsDataSource, ReportsSourcePort {
  private readonly orders = inject(VENDOR_ORDER_REPOSITORY);
  private readonly entries = signal<ReportEntry[]>([]);
  readonly loading = signal(false);
  readonly snapshot = computed(() => buildReportSnapshot(this.entries()));

  async read(): Promise<ReportsReadResult> {
    const orders = await firstValueFrom(this.orders.listOrders());
    return {
      entries: orders.map((order) => ({
        date: order.createdAt,
        total: order.total,
        status: order.status,
      })),
      loadedAt: new Date(),
    };
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const { entries } = await this.read();
      this.entries.set([...entries]);
    } catch {
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
