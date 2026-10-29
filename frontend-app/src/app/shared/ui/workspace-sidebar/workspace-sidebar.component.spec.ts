import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import type { WorkspaceModuleGroup } from '../../../core/workspace/models/workspace-module.model';
import { WorkspaceSidebarComponent } from './workspace-sidebar.component';

@Component({ standalone: true, template: '' })
class StubPageComponent {}

const GROUPS: WorkspaceModuleGroup[] = [
  {
    section: 'operacion',
    label: 'Tienda',
    items: [
      {
        id: 'store.home',
        label: 'Inicio',
        icon: 'fa-solid fa-house',
        link: '/vendedor/inicio',
        testId: 'vendor-nav-inicio',
        workspace: 'store',
        section: 'operacion',
        permission: 'store:read',
        status: 'ready',
      },
      {
        id: 'store.orders',
        label: 'Pedidos',
        icon: 'fa-solid fa-receipt',
        link: '/vendedor/pedidos',
        testId: 'vendor-nav-pedidos',
        workspace: 'store',
        section: 'operacion',
        permission: 'store:manage-orders',
        status: 'ready',
      },
    ],
  },
  {
    section: 'footer',
    label: '',
    items: [
      {
        id: 'store.help',
        label: 'Ayuda',
        icon: 'fa-solid fa-circle-question',
        link: '/vendedor/ayuda',
        testId: 'vendor-nav-ayuda',
        workspace: 'store',
        section: 'footer',
        permission: 'store:read',
        status: 'ready',
      },
    ],
  },
];

describe('WorkspaceSidebarComponent', () => {
  const setup = async (wide = false, extras: { eyebrow?: string; title?: string } = {}) => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceSidebarComponent],
      providers: [provideRouter([{ path: '**', component: StubPageComponent }])],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkspaceSidebarComponent);
    fixture.componentRef.setInput('groups', GROUPS);
    fixture.componentRef.setInput('sidebarLabel', 'Navegación de la tienda');
    fixture.componentRef.setInput('wide', wide);
    if (extras.eyebrow) fixture.componentRef.setInput('eyebrow', extras.eyebrow);
    if (extras.title) fixture.componentRef.setInput('title', extras.title);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar los grupos y sus ítems en orden', async () => {
    const fixture = await setup();
    const links = fixture.debugElement.queryAll(By.css('a[data-testid^="vendor-nav-"]'));

    expect(links.map((link) => link.nativeElement.textContent.trim())).toEqual([
      'Inicio',
      'Pedidos',
      'Ayuda',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Tienda');
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

  it('debe emitir itemSelected y closed', async () => {
    const fixture = await setup();
    const selected = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.itemSelected.subscribe(selected);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('[data-testid="vendor-nav-inicio"]')).nativeElement.click();
    fixture.debugElement.query(By.css('[role="presentation"]')).nativeElement.click();

    expect(selected).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar el bloque de marca cuando recibe eyebrow y title', async () => {
    const fixture = await setup(true, { eyebrow: 'Empresa', title: 'Workspace empresarial' });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Empresa');
    expect(host.textContent).toContain('Workspace empresarial');
    expect(host.querySelector('aside')?.classList.contains('w-72')).toBe(true);
  });

  it('debe usar el ancho compacto por defecto', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('aside')?.classList.contains('w-64')).toBe(true);
  });
});
