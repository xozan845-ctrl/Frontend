import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  ReportEntry,
  ReportsDataSource,
  ReportsReadResult,
  ReportsSourcePort,
} from '@domains/reports/public-api';
import { buildReportSnapshot } from '@domains/reports/public-api';
import { COMPANY_PORTAL_REPOSITORY } from '@domains/company-sales/public-api';

/** Fuente de reportes de empresa sobre `GET /orders/empresa`. */
@Injectable()
export class CompanyReportsSource implements ReportsDataSource, ReportsSourcePort {
  private readonly orders = inject(COMPANY_PORTAL_REPOSITORY);
  private readonly entries = signal<ReportEntry[]>([]);
  readonly loading = signal(false);
  readonly snapshot = computed(() => buildReportSnapshot(this.entries()));

  async read(): Promise<ReportsReadResult> {
    const orders = await firstValueFrom(this.orders.orders({ limit: 100 }));
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
