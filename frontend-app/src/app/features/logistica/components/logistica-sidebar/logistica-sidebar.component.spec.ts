import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LogisticaSidebarComponent } from './logistica-sidebar.component';

@Component({ selector: 'app-blank-page', standalone: true, template: '' })
class BlankPageComponent {}

describe('LogisticaSidebarComponent', () => {
  const setup = async (open = false) => {
    await TestBed.configureTestingModule({
      imports: [LogisticaSidebarComponent],
      providers: [provideRouter([{ path: '**', component: BlankPageComponent }])],
    }).compileComponents();
    const fixture = TestBed.createComponent(LogisticaSidebarComponent);
    fixture.componentRef.setInput('open', open);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar las nueve secciones y la configuración', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('nav a')).toHaveLength(10);
    expect(host.textContent).toContain('Envíos');
    expect(host.textContent).toContain('Mapa de clientes');
    expect(host.textContent).toContain('Pedidos en ruta');
    expect(host.textContent).toContain('Configuración');
    expect(
      host.querySelector('[data-testid="logistica-nav-dashboard"]')?.getAttribute('href'),
    ).toBe('/logistica/dashboard');
  });

  it('debe avisar al shell al elegir una sección', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let selected = 0;
    fixture.componentInstance.itemSelected.subscribe(() => selected++);

    (host.querySelector('[data-testid="logistica-nav-rutas"]') as HTMLAnchorElement).click();
    await fixture.whenStable();

    expect(selected).toBe(1);
  });

  it('debe conservar el contexto de empresa al navegar dentro de logística', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('basePath', '/empresa/logistica');
    fixture.detectChanges();

    expect(
      (
        fixture.nativeElement.querySelector(
          '[data-testid="logistica-nav-dashboard"]',
        ) as HTMLAnchorElement
      ).getAttribute('href'),
    ).toBe('/empresa/logistica/dashboard');
  });

  it('debe mostrar el backdrop con el drawer abierto', async () => {
    const fixture = await setup(true);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.backdrop-blur-sm')).not.toBeNull();
  });

  it('no debe mostrar el backdrop con el drawer cerrado', async () => {
    const fixture = await setup(false);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.backdrop-blur-sm')).toBeNull();
  });
});
