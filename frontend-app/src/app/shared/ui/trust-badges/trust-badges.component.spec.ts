import { TestBed } from '@angular/core/testing';
import { TrustBadgesComponent } from './trust-badges.component';

describe('TrustBadgesComponent', () => {
  it('debe mostrar las cuatro insignias de confianza', () => {
    TestBed.configureTestingModule({ imports: [TrustBadgesComponent] });
    const fixture = TestBed.createComponent(TrustBadgesComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pago Seguro');
    expect(text).toContain('30 Días Retorno');
    expect(text).toContain('Envío Global');
    expect(text).toContain('Soporte 24/7');
  });
});
