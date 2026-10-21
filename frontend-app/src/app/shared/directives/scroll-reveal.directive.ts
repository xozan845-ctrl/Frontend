import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
  host: {
    '[class.scroll-reveal]': 'true',
  },
})
export class ScrollRevealDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        this.el.nativeElement.classList.add('scroll-reveal--visible');
        this.observer.unobserve(this.el.nativeElement);
      }
    },
    { threshold: 0.1 },
  );

  /** Arranca la observación al construir la directiva (sin `ngOnInit`). */
  private readonly started = this.observer.observe(this.el.nativeElement);
  private readonly cleanup = inject(DestroyRef).onDestroy(() => this.observer.disconnect());
}
