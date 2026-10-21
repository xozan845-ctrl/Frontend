import { DestroyRef, Directive, ElementRef, inject, OnInit } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
  host: {
    '[class.scroll-reveal]': 'true',
  },
})
export class ScrollRevealDirective implements OnInit {
  private el = inject(ElementRef);
  private observer: IntersectionObserver | null = null;
  private readonly cleanup = inject(DestroyRef).onDestroy(() => this.observer?.disconnect());

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.el.nativeElement.classList.add('scroll-reveal--visible');
          this.observer?.unobserve(this.el.nativeElement);
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(this.el.nativeElement);
  }
}
