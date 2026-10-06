import { Component, signal, input, HostListener } from '@angular/core';

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  templateUrl: './image-lightbox.component.html',
  styleUrl: './image-lightbox.component.css',
})
export class ImageLightboxComponent {
  imageUrl = input.required<string>();
  imageAlt = input('');

  isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.isOpen.set(false);
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.closeLightbox();
  }
}
