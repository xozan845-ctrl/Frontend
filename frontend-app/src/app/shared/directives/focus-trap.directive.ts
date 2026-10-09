import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Atrapa el foco dentro del elemento anfitrión mientras está activo, lo
 * devuelve al disparador al desactivarse/destruirse y emite `escape` al pulsar
 * Escape (R-AC-3).
 *
 * Uso: `[appFocusTrap]="isOpen()" (escape)="close()"` sobre un contenedor
 * `role="dialog"` con `tabindex="-1"`.
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements OnDestroy {
  readonly appFocusTrap = input<boolean>(true);
  /** Emite cuando se pulsa Escape mientras el foco está atrapado. */
  readonly escape = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previouslyFocused: HTMLElement | null = null;
  private active = false;

  constructor() {
    effect(() => {
      const enabled = this.appFocusTrap();
      if (enabled && !this.active) {
        this.activate();
      } else if (!enabled && this.active) {
        this.deactivate();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.active) this.deactivate();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.active || event.key !== 'Tab') return;
    const focusable = this.focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.host.nativeElement.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.active) this.escape.emit();
  }

  private activate(): void {
    this.previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.active = true;
    const [first] = this.focusableElements();
    (first ?? this.host.nativeElement).focus();
  }

  private deactivate(): void {
    this.active = false;
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }
}
