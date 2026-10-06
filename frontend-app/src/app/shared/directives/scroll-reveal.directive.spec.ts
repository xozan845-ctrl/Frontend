import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(public readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }
}

@Component({
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `<div appScrollReveal>contenido</div>`,
})
class HostComponent {}

describe('ScrollRevealDirective', () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('debe observar el elemento al inicializar', () => {
    const fixture = TestBed.createComponent(HostComponent);

    fixture.detectChanges();

    expect(MockIntersectionObserver.instances[0].observe).toHaveBeenCalledTimes(1);
  });

  it('debe revelar el elemento cuando entra en pantalla', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const observer = MockIntersectionObserver.instances[0];
    const element = fixture.nativeElement.querySelector('div') as HTMLElement;

    observer.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    );

    expect(element.classList).toContain('scroll-reveal--visible');
    expect(observer.unobserve).toHaveBeenCalledWith(element);
  });

  it('debe desconectar el observer al destruir el componente', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const observer = MockIntersectionObserver.instances[0];

    fixture.destroy();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});
