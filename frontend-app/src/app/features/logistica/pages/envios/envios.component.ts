import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { AuthStore } from '../../../auth/public-api';
import { Shipment, ShipmentProvider, shipmentStatusLabel } from '../../models/envio.model';
import { EnviosStore } from '../../state/envios/envios.store';

const TARGET_STATES = [
  { value: 'enviada', label: 'Enviada' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
] as const;

/** Envíos de logística (ADR-37): admin global o empresario de la empresa. */
@Component({
  selector: 'app-envios-page',
  standalone: true,
  imports: [DatePipe, AppCurrencyPipe, SkeletonLoaderComponent],
  templateUrl: './envios.component.html',
})
export default class EnviosComponent {
  readonly envios = inject(EnviosStore);
  readonly authStore = inject(AuthStore);
  private readonly seoService = injectSeoPage(
    'Envíos — Logística',
    'Consulta las guías de despacho, asigna flota y avanza su estado.',
  );

  readonly statusLabel = shipmentStatusLabel;
  readonly targetStates = TARGET_STATES;
  readonly statusFilter = signal<string>('');
  readonly providerDrafts = signal<Record<string, ShipmentProvider>>({});
  readonly statusDrafts = signal<Record<string, string>>({});

  readonly isAdmin = computed(() => {
    const role = this.authStore.user()?.role;
    return role === 'admin' || role === 'super_admin';
  });
  readonly isEmpresario = computed(() => this.authStore.user()?.role === 'empresario');
  readonly filteredShipments = computed(() => {
    const status = this.statusFilter();
    return status
      ? this.envios.shipments().filter((shipment) => shipment.status === status)
      : this.envios.shipments();
  });

  private readonly loadShipments = this.envios.load();

  canAssign(shipment: Shipment): boolean {
    return this.isEmpresario() && shipment.logisticsMode === 'hibrida';
  }

  canAdvance(shipment: Shipment): boolean {
    if (shipment.status === 'entregada' || shipment.status === 'cancelada') return false;
    // El backend solo mueve guías ya asignadas a una flota con tenant.
    if (!shipment.providerTenantId) return false;
    if (this.isAdmin()) return true;
    return this.isEmpresario() && shipment.providerTenantId === this.authStore.user()?.tenantId;
  }

  providerFor(shipment: Shipment): ShipmentProvider {
    return this.providerDrafts()[shipment.id] ?? shipment.providerType ?? 'plataforma';
  }

  onProviderChange(shipment: Shipment, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ShipmentProvider;
    this.providerDrafts.update((drafts) => ({ ...drafts, [shipment.id]: value }));
  }

  assign(shipment: Shipment): void {
    this.envios.assignProvider({ id: shipment.id, provider: this.providerFor(shipment) });
  }

  statusFor(shipment: Shipment): string {
    if (this.statusDrafts()[shipment.id]) return this.statusDrafts()[shipment.id];
    if (shipment.status === 'en_preparacion') return 'enviada';
    if (shipment.status === 'enviada') return 'entregada';
    return 'cancelada';
  }

  onStatusChange(shipment: Shipment, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusDrafts.update((drafts) => ({ ...drafts, [shipment.id]: value }));
  }

  advance(shipment: Shipment): void {
    this.envios.advanceStatus({ id: shipment.id, status: this.statusFor(shipment) });
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }
}
