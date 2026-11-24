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
import { COMPANY_PORTAL_REPOSITORY } from '@domains/company-sales/public-api';

const LOAD_ERROR = 'No se pudieron cargar los reportes de la empresa.';

/** Fuente de reportes de empresa sobre `GET /orders/empresa`. */
@Injectable()
export class CompanyReportsSource implements ReportsDataSource, ReportsSourcePort {
  private readonly orders = inject(COMPANY_PORTAL_REPOSITORY);
  private readonly entries = signal<ReportEntry[]>([]);
  private readonly failure = signal<string | null>(null);
  private readonly updatedAt = signal<Date | null>(null);
  readonly loading = signal(false);
  readonly error = this.failure.asReadonly();
  readonly lastUpdatedAt = this.updatedAt.asReadonly();
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
