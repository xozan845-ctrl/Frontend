import { TestBed } from '@angular/core/testing';
import { TrustBadgesComponent } from './trust-badges.component';
import type { TrustBadge } from './trust-badges.types';

describe('TrustBadgesComponent', () => {
  const setup = async (badges?: readonly TrustBadge[], compact = false) => {
    await TestBed.configureTestingModule({ imports: [TrustBadgesComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TrustBadgesComponent);
    if (badges) fixture.componentRef.setInput('badges', badges);
    fixture.componentRef.setInput('compact', compact);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar las insignias por defecto con subtítulo', async () => {
    const fixture = await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pago Seguro');
    expect(text).toContain('30 Días Retorno');
    expect(text).toContain('Envío Global');
    expect(text).toContain('Soporte 24/7');
    expect(text).toContain('Datos encriptados');
  });

  it('debe aceptar insignias y variante compacta sin subtítulos', async () => {
    const fixture = await setup(
      [
        { icon: 'fa-solid fa-lock', title: 'Compra protegida', subtitle: 'Ignorado' },
        { icon: 'fa-solid fa-truck', title: 'Envío 24-48h', subtitle: 'Ignorado' },
      ],
      true,
    );
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Compra protegida');
    expect(host.textContent).toContain('Envío 24-48h');
    expect(host.textContent).not.toContain('Ignorado');
    expect(host.querySelector('div')?.className).toContain('grid-cols-2');
  });
});
