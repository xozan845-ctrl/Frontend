import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import LegacyWorkspaceRedirectComponent, {
  legacyWorkspaceTarget,
} from './legacy-workspace-redirect.component';

describe('LegacyWorkspaceRedirectComponent', () => {
  it('redirige al destino canónico conservando la ruta', async () => {
    const navigateByUrl = vi.fn();
    await TestBed.configureTestingModule({
      imports: [LegacyWorkspaceRedirectComponent],
      providers: [
        {
          provide: Router,
          useValue: { url: '/vendedor/pedidos?x=1', navigateByUrl },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LegacyWorkspaceRedirectComponent);

    fixture.detectChanges();

    expect(navigateByUrl).toHaveBeenCalledWith('/app/tienda/pedidos?x=1', {
      replaceUrl: true,
    });
  });
});

describe('legacyWorkspaceTarget', () => {
  it.each([
    ['/empresa', '/app/empresa'],
    ['/empresa/inicio', '/app/empresa/inicio'],
    ['/vendedor/pedidos?x=1', '/app/tienda/pedidos?x=1'],
    ['/admin/inventario', '/app/admin/inventario'],
    ['/logistica/dashboard', '/app/logistica/dashboard'],
    ['/facturacion/nueva', '/app/tienda/facturacion/nueva'],
  ])('traduce %s a %s', (from, expected) => {
    expect(legacyWorkspaceTarget(from)).toBe(expected);
  });
});
