import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { BillingSidebarComponent } from './billing-sidebar.component';

@Component({ standalone: true, template: '' })
class StubPageComponent {}

describe('BillingSidebarComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [BillingSidebarComponent],
      providers: [provideRouter([{ path: '**', component: StubPageComponent }])],
    }).compileComponents();
    const fixture = TestBed.createComponent(BillingSidebarComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar las secciones activas y las próximas', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const links = fixture.debugElement.queryAll(By.css('a[data-testid^="billing-nav-"]'));

    expect(links.map((link) => link.nativeElement.textContent.trim())).toEqual([
      'Nueva factura',
      'Facturas',
      'Panel del vendedor',
    ]);
    expect(host.textContent).toContain('Cotizaciones');
    expect(host.textContent).toContain('Pronto');
  });

  it('debe marcar la factura activa con aria-current', async () => {
    const fixture = await setup();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/facturacion/facturas');
    fixture.detectChanges();

    const active = fixture.debugElement.query(By.css('[data-testid="billing-nav-facturas"]'));
    expect(active.nativeElement.getAttribute('aria-current')).toBe('page');
    expect(active.nativeElement.classList.contains('bg-accent-600')).toBe(true);
  });

  it('debe emitir itemSelected al navegar y closed con el backdrop', async () => {
    const fixture = await setup();
    const selected = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.itemSelected.subscribe(selected);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="billing-nav-nueva"]')).nativeElement.click();
    fixture.detectChanges();

    expect(selected).toHaveBeenCalledTimes(1);
    expect(closed).not.toHaveBeenCalled();

    fixture.debugElement.query(By.css('[role="presentation"]')).nativeElement.click();
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
