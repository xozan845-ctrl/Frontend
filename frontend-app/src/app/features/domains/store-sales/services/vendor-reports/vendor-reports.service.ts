import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toUserMessage } from '@core/models/api-error';
import type {
  ReportEntry,
  ReportsDataSource,
  ReportsReadResult,
  ReportsSourcePort,
} from '@domains/reports/public-api';
import { buildReportSnapshot } from '@domains/reports/public-api';
import { VENDOR_ORDER_REPOSITORY } from '../../repositories/vendor-order.repository';

const LOAD_ERROR = 'No se pudieron cargar los reportes de la tienda.';

/** Fuente de reportes de la tienda sobre los pedidos del vendedor. */
@Injectable()
export class VendorReportsSource implements ReportsDataSource, ReportsSourcePort {
  private readonly orders = inject(VENDOR_ORDER_REPOSITORY);
  private readonly entries = signal<ReportEntry[]>([]);
  private readonly failure = signal<string | null>(null);
  private readonly updatedAt = signal<Date | null>(null);
  readonly loading = signal(false);
  readonly error = this.failure.asReadonly();
  readonly lastUpdatedAt = this.updatedAt.asReadonly();
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
    this.failure.set(null);
    try {
      const { entries, loadedAt } = await this.read();
      this.entries.set([...entries]);
      this.updatedAt.set(loadedAt);
    } catch (error) {
      this.failure.set(toUserMessage(error, LOAD_ERROR));
    } finally {
      this.loading.set(false);
    }
  }
}
