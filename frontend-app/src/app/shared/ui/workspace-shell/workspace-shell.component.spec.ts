import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import type { WorkspaceModuleGroup } from '../../../core/workspace/models/workspace-module.model';
import { WorkspaceShellComponent } from './workspace-shell.component';
import { WorkspaceSidebarComponent } from '../workspace-sidebar/workspace-sidebar.component';

const GROUPS: WorkspaceModuleGroup[] = [
  {
    section: 'operacion',
    label: 'Operación',
    items: [
      {
        id: 'company.dashboard',
        label: 'Dashboard',
        icon: 'fa-solid fa-grid-2',
        link: '/empresa/inicio',
        testId: 'company-nav-inicio',
        workspace: 'company',
        section: 'operacion',
        permission: 'company:read',
        status: 'ready',
      },
    ],
  },
];

describe('WorkspaceShellComponent', () => {
  const setup = async (open = false) => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkspaceShellComponent);
    fixture.componentRef.setInput('groups', GROUPS);
    fixture.componentRef.setInput('sidebarLabel', 'Navegación de la empresa');
    fixture.componentRef.setInput('toggleTestId', 'company-sidebar-toggle');
    fixture.componentRef.setInput('sidebarId', 'company-sidebar');
    fixture.componentRef.setInput('open', open);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe montar el sidebar y el outlet', async () => {
    const fixture = await setup();

    expect(fixture.debugElement.query(By.directive(WorkspaceSidebarComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('router-outlet'))).toBeTruthy();
  });

  it('debe emitir openChange al abrir y cerrar con Escape', async () => {
    const fixture = await setup();
    const changes: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((value) => changes.push(value));

    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="company-sidebar-toggle"]',
    ) as HTMLButtonElement;
    toggle.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(changes).toEqual([true, false]);
  });

  it('debe cerrar el drawer al elegir un ítem', async () => {
    const fixture = await setup(true);
    const changes: boolean[] = [];
    const selected = vi.fn();
    fixture.componentInstance.openChange.subscribe((value) => changes.push(value));
    fixture.componentInstance.itemSelected.subscribe(selected);

    const sidebar = fixture.debugElement.query(By.directive(WorkspaceSidebarComponent))
      .componentInstance as WorkspaceSidebarComponent;
    sidebar.itemSelected.emit();

    expect(selected).toHaveBeenCalledOnce();
    expect(changes).toEqual([false]);
  });
});
