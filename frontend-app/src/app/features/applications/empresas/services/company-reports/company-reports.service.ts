import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ReportEntry, ReportsDataSource } from '../../../../domains/reports/public-api';
import { buildReportSnapshot } from '../../../../domains/reports/public-api';
import { COMPANY_PORTAL_REPOSITORY } from '../../repositories/company-portal.repository';

/** Fuente de reportes de empresa sobre `GET /orders/empresa`. */
@Injectable()
export class CompanyReportsSource implements ReportsDataSource {
  private readonly orders = inject(COMPANY_PORTAL_REPOSITORY);
  private readonly entries = signal<ReportEntry[]>([]);
  readonly loading = signal(false);
  readonly snapshot = computed(() => buildReportSnapshot(this.entries()));

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const orders = await firstValueFrom(this.orders.orders({ limit: 100 }));
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
