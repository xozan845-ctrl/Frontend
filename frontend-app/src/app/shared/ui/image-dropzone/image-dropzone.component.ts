import { Component, computed, input, output, signal } from '@angular/core';

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? Math.round(megabytes) : megabyteLabel(megabytes)} MB`;
}

function megabyteLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Zona reutilizable de carga de imágenes con arrastrar y soltar, clic,
 * validación de tipo/tamaño, vista previa y estado de subida.
 *
 * Es presentacional: no conoce storage ni la entidad dueña de la imagen. El
 * consumidor recibe el `File` y decide cómo subirlo y asociarlo.
 */
@Component({
  selector: 'app-image-dropzone',
  standalone: true,
  templateUrl: './image-dropzone.component.html',
})
export class ImageDropzoneComponent {
  readonly label = input('Imagen');
  readonly hint = input('Arrastra una imagen o haz clic para seleccionarla.');
  readonly accept = input('image/*');
  readonly maxBytes = input(DEFAULT_MAX_BYTES);
  readonly previewUrl = input<string | null>(null);
  readonly alt = input('Vista previa de la imagen');
  readonly uploading = input(false);
  readonly disabled = input(false);
  readonly removable = input(true);
  readonly variant = input<'square' | 'wide'>('wide');
  readonly fileSelected = output<File>();
  readonly removed = output<void>();

  readonly isDragging = signal(false);
  readonly error = signal<string | null>(null);
  readonly maxSizeLabel = computed(() => formatBytes(this.maxBytes()));
  readonly frameClass = computed(() =>
    this.variant() === 'square' ? 'aspect-square w-full max-w-48' : 'aspect-video w-full',
  );

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receive(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled() || this.uploading()) return;
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.disabled() || this.uploading()) return;
    this.receive(event.dataTransfer?.files ?? null);
  }

  remove(): void {
    if (this.disabled() || this.uploading()) return;
    this.error.set(null);
    this.removed.emit();
  }

  clearError(): void {
    this.error.set(null);
  }

  private receive(files: FileList | null): void {
    if (this.disabled() || this.uploading()) return;

    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error.set('El archivo debe ser una imagen.');
      return;
    }
    if (this.maxBytes() > 0 && file.size > this.maxBytes()) {
      this.error.set(`La imagen supera el límite de ${this.maxSizeLabel()}.`);
      return;
    }

    this.error.set(null);
    this.fileSelected.emit(file);
  }
}
