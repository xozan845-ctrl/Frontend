import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { InitialsPipe } from '../../../../../shared/pipes/initials.pipe';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { ClientModalComponent } from '../../components/client-modal/client-modal.component';
import {
  CLIENT_IMPORT_MAX_BYTES,
  ClientsStore,
  type ClientChip,
  ClientStatus,
  ClientsTab,
  CreateClientPayload,
} from '../../../../domains/clients/public-api';
import { CLIENTS_PAGE_CONFIG } from '../../../../../shared/clients/constants/clients-config.tokens';

const STATUS_LABELS: Readonly<Record<ClientStatus, string>> = {
  activo: 'Activo',
  nuevo: 'Nuevo',
  frecuente: 'Frecuente',
  inactivo: 'Inactivo',
  sin_compras: 'Sin compras',
};

const STATUS_CLASSES: Readonly<Record<ClientStatus, string>> = {
  activo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  nuevo: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
  frecuente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  inactivo: 'bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-slate-300',
  sin_compras: 'bg-slate-100 text-slate-500 dark:bg-surface-700 dark:text-slate-400',
};

const TAB_CLASSES = {
  active: 'bg-accent-600 text-white shadow-sm',
  idle: 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-white',
} as const;

const CHIP_CLASSES = {
  active: 'border-accent-600 bg-accent-600 text-white',
  idle: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-300 dark:hover:text-white',
} as const;

/**
 * Cartera de clientes del workspace de empresa (ADR-51). La página solo lee
 * señales del store; los derivados (KPIs, filtros y paginación) viven en
 * `ClientsStore.withComputed`.
 */
@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    RouterLink,
    AppCurrencyPipe,
    AppDatePipe,
    InitialsPipe,
    SkeletonLoaderComponent,
    ClientModalComponent,
  ],
  templateUrl: './clients.component.html',
})
export default class ClientsPageComponent {
  readonly clients = inject(ClientsStore);
  readonly config = inject(CLIENTS_PAGE_CONFIG);
  private readonly seoService = injectSeoPage(this.config.title, this.config.subtitle);

  readonly isModalOpen = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly importing = signal(false);
  readonly importError = signal<string | null>(null);

  readonly tabs: readonly { value: ClientsTab; label: string; icon: string }[] = [
    { value: 'list', label: 'Lista de clientes', icon: 'fa-solid fa-user-group' },
    { value: 'top', label: 'Top clientes', icon: 'fa-solid fa-trophy' },
    { value: 'frequent', label: 'Frecuentes', icon: 'fa-solid fa-repeat' },
    { value: 'inactive', label: 'Inactivos', icon: 'fa-solid fa-user-slash' },
  ];

  readonly chips: readonly { value: ClientChip; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'frequent', label: 'Frecuentes' },
    { value: 'new', label: 'Nuevos' },
    { value: 'with-orders', label: 'Con compras' },
    { value: 'without-orders', label: 'Sin compras' },
  ];

  private readonly loadOrders = this.clients.loadOrders();

  onSearchInput(event: Event): void {
    this.clients.setSearch((event.target as HTMLInputElement).value);
  }

  setTab(tab: ClientsTab): void {
    this.clients.setTab(tab);
  }

  setChip(chip: ClientChip): void {
    this.clients.setChip(chip);
  }

  sync(): void {
    this.importError.set(null);
    this.clients.loadOrders();
  }

  openModal(): void {
    this.modalError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  submitClient(payload: CreateClientPayload): void {
    const result = this.clients.addLocalClient(payload);
    if (result.ok) {
      this.modalError.set(null);
      this.isModalOpen.set(false);
      return;
    }
    this.modalError.set(result.message ?? 'No se pudo agregar el cliente.');
  }

  async onImportFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.importError.set(null);
    if (file.size > CLIENT_IMPORT_MAX_BYTES) {
      this.importError.set('El archivo supera el límite de 2 MB.');
      return;
    }

    this.importing.set(true);
    try {
      const text = await this.readFile(file);
      const result = this.clients.importCsv(text);
      if (result.imported === 0) {
        this.importError.set(
          result.errors[0] ??
            'No se importó ningún cliente. Revisa el archivo e inténtalo de nuevo.',
        );
      }
    } catch {
      this.importError.set('No se pudo leer el archivo. Inténtalo de nuevo.');
    } finally {
      this.importing.set(false);
    }
  }

  readonly statusLabels = STATUS_LABELS;

  statusClass(status: ClientStatus): string {
    return `inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ${STATUS_CLASSES[status]}`;
  }

  tabClass(tab: ClientsTab): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors';
    return `${base} ${this.clients.tab() === tab ? TAB_CLASSES.active : TAB_CLASSES.idle}`;
  }

  chipClass(chip: ClientChip): string {
    const base =
      'rounded-lg border px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors';
    return `${base} ${this.clients.chip() === chip ? CHIP_CLASSES.active : CHIP_CLASSES.idle}`;
  }

  private async readFile(file: File): Promise<string> {
    if (typeof file.text === 'function') return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsText(file);
    });
  }
}
