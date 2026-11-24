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

  it('no debe mostrar promesas cuando no recibe beneficios aprobados', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="trust-badges"]')).toBeNull();
    expect(host.textContent).not.toContain('Retorno');
    expect(host.textContent).not.toContain('Envío Global');
    expect(host.textContent).not.toContain('Soporte 24/7');
  });

  it('debe mostrar solo los beneficios recibidos por input', async () => {
    const fixture = await setup([
      { icon: 'fa-solid fa-lock', title: 'Compra protegida', subtitle: 'Datos cifrados' },
      { icon: 'fa-solid fa-truck', title: 'Entrega local' },
    ]);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid="trust-badge"]')).toHaveLength(2);
    expect(host.textContent).toContain('Compra protegida');
    expect(host.textContent).toContain('Datos cifrados');
    expect(host.textContent).toContain('Entrega local');
    expect(host.textContent).not.toContain('30 Días Retorno');
  });

  it('debe ocultar subtítulos en la variante compacta', async () => {
    const fixture = await setup(
      [{ icon: 'fa-solid fa-lock', title: 'Compra protegida', subtitle: 'Ignorado' }],
      true,
    );
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Compra protegida');
    expect(host.textContent).not.toContain('Ignorado');
    expect(host.querySelector('[data-testid="trust-badges"]')?.className).toContain('grid-cols-2');
  });
});
