import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ReportEntry, ReportsDataSource } from '../../../../domains/reports/public-api';
import { buildReportSnapshot } from '../../../../domains/reports/public-api';
import { VENDOR_ORDER_REPOSITORY } from '../../repositories/vendor-order.repository';

/** Fuente de reportes de la tienda sobre los pedidos del vendedor. */
@Injectable()
export class VendorReportsSource implements ReportsDataSource {
  private readonly orders = inject(VENDOR_ORDER_REPOSITORY);
  private readonly entries = signal<ReportEntry[]>([]);
  readonly loading = signal(false);
  readonly snapshot = computed(() => buildReportSnapshot(this.entries()));

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const orders = await firstValueFrom(this.orders.listOrders());
      this.entries.set(
        orders.map((order) => ({
          date: order.createdAt,
          total: order.total,
          status: order.status,
        })),
      );
    } catch {
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
