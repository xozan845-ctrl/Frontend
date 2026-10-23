import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import {
  StorageTenant,
  bytesToGigabytes,
  formatBytes,
  gigabytesToBytes,
  storageStatusLabel,
  storageUsagePercent,
} from '../../models/storage.model';
import { StorageStore } from '../../state/storage/storage.store';

/** Administración de almacenamiento por tenant (ADR-38). */
@Component({
  selector: 'app-admin-storage',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SkeletonLoaderComponent],
  templateUrl: './storage.component.html',
})
export default class AdminStorageComponent {
  readonly storage = inject(StorageStore);
  private readonly seoService = injectSeoPage(
    'Almacenamiento — Administración',
    'Consulta y ajusta la cuota, el uso y el estado del almacenamiento por empresa.',
  );

  readonly formatBytes = formatBytes;
  readonly statusLabel = storageStatusLabel;
  readonly usagePercent = storageUsagePercent;
  readonly quotaDrafts = signal<Record<string, string>>({});

  private readonly loadStorage = this.storage.load();

  quotaValue(tenant: StorageTenant): string {
    return this.quotaDrafts()[tenant.tenantId] ?? String(bytesToGigabytes(tenant.quotaBytes));
  }

  onQuotaInput(tenantId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.quotaDrafts.update((drafts) => ({ ...drafts, [tenantId]: value }));
  }

  isQuotaValid(tenant: StorageTenant): boolean {
    const gigabytes = Number(this.quotaValue(tenant));
    return Number.isFinite(gigabytes) && gigabytes > 0;
  }

  saveQuota(tenant: StorageTenant): void {
    if (!this.isQuotaValid(tenant)) return;
    this.storage.updateQuota({
      tenantId: tenant.tenantId,
      quotaBytes: gigabytesToBytes(Number(this.quotaValue(tenant))),
    });
    this.quotaDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[tenant.tenantId];
      return next;
    });
  }

  toggleStatus(tenant: StorageTenant): void {
    this.storage.setStatus({
      tenantId: tenant.tenantId,
      status: tenant.status === 'activo' ? 'suspendido' : 'activo',
    });
  }

  recalculate(tenant: StorageTenant): void {
    this.storage.recalculate(tenant.tenantId);
  }
}
