import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { VendorSidebarComponent } from './vendor-sidebar.component';

@Component({ standalone: true, template: '' })
class StubPageComponent {}

describe('VendorSidebarComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [VendorSidebarComponent],
      providers: [provideRouter([{ path: '**', component: StubPageComponent }])],
    }).compileComponents();
    const fixture = TestBed.createComponent(VendorSidebarComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar todas las secciones del diseño en orden', async () => {
    const fixture = await setup();

    const links = fixture.debugElement.queryAll(By.css('a[data-testid^="vendor-nav-"]'));

    expect(links.map((link) => link.nativeElement.textContent.trim())).toEqual([
      'Inicio',
      'Productos',
      'Clientes',
      'Ventas',
      'Pedidos',
      'Mi empresa',
      'Mi tienda',
      'Facturación',
      'Inventario',
      'Reportes',
      'Ajustes',
      'Ayuda y soporte',
    ]);
  });

  it('debe marcar la sección activa con aria-current', async () => {
    const fixture = await setup();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/vendedor/pedidos');
    fixture.detectChanges();

    const active = fixture.debugElement.query(By.css('[data-testid="vendor-nav-pedidos"]'));
    expect(active.nativeElement.getAttribute('aria-current')).toBe('page');
    expect(active.nativeElement.classList.contains('bg-accent-600')).toBe(true);
  });

  it('debe emitir itemSelected al elegir un ítem y closed al tocar el backdrop', async () => {
    const fixture = await setup();
    const selected = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.itemSelected.subscribe(selected);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="vendor-nav-inicio"]')).nativeElement.click();
    fixture.detectChanges();

    expect(selected).toHaveBeenCalledTimes(1);
    expect(closed).not.toHaveBeenCalled();

    fixture.debugElement.query(By.css('[role="presentation"]')).nativeElement.click();
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
