import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import {
  StorageTenant,
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
  readonly quotaValues = this.storage.quotaValues;
  readonly quotaValid = this.storage.quotaValid;

  private readonly loadStorage = this.storage.load();

  onQuotaInput(tenantId: string, event: Event): void {
    this.storage.setQuotaDraft(tenantId, (event.target as HTMLInputElement).value);
  }

  saveQuota(tenant: StorageTenant): void {
    if (!this.storage.quotaValid()[tenant.tenantId]) return;
    this.storage.updateQuota({
      tenantId: tenant.tenantId,
      quotaBytes: gigabytesToBytes(Number(this.storage.quotaValues()[tenant.tenantId])),
    });
    this.storage.clearQuotaDraft(tenant.tenantId);
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
