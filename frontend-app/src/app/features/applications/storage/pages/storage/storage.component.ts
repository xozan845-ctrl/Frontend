import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import {
  StorageObject,
  formatStorageBytes,
  storageBucketUsage,
  storageObjectStatusLabel,
} from '../../models/storage.model';
import { StorageStore } from '../../state/storage/storage.store';

/** Almacenamiento del tenant (ADR-42). */
@Component({
  selector: 'app-storage-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, SkeletonLoaderComponent],
  templateUrl: './storage.component.html',
})
export default class StorageComponent {
  readonly storage = inject(StorageStore);
  private readonly document = inject(DOCUMENT);
  private readonly seoService = injectSeoPage(
    'Almacenamiento',
    'Administra los archivos, la cuota y el espacio disponible de tu empresa.',
  );

  readonly formatBytes = formatStorageBytes;
  readonly statusLabel = storageObjectStatusLabel;
  readonly bucketUsage = storageBucketUsage;
  readonly selectedFile = signal<File | null>(null);
  readonly folder = signal('');
  readonly description = signal('');

  private readonly loadStorage = this.storage.load();
  private readonly openDownload = effect(() => {
    const url = this.storage.downloadUrl();
    if (!url) return;
    this.document.defaultView?.open(url, '_blank', 'noopener');
    this.storage.clearDownload();
  });

  onSearchInput(event: Event): void {
    this.storage.setQuery((event.target as HTMLInputElement).value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.storage.setStatusFilter(value || null);
  }

  onFileSelected(event: Event): void {
    this.selectedFile.set((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  onFolderInput(event: Event): void {
    this.folder.set((event.target as HTMLInputElement).value);
  }

  onDescriptionInput(event: Event): void {
    this.description.set((event.target as HTMLInputElement).value);
  }

  upload(input: HTMLInputElement): void {
    const file = this.selectedFile();
    if (!file) return;
    this.storage.upload({
      name: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      folder: this.folder().trim() || undefined,
      description: this.description().trim() || undefined,
      file,
    });
    this.selectedFile.set(null);
    this.folder.set('');
    this.description.set('');
    input.value = '';
  }

  download(object: StorageObject): void {
    this.storage.download(object.id);
  }

  requestDelete(object: StorageObject): void {
    this.storage.requestDelete(object.id);
  }

  cancelDelete(): void {
    this.storage.cancelDelete();
  }

  confirmDelete(object: StorageObject): void {
    this.storage.delete(object.id);
  }
}
