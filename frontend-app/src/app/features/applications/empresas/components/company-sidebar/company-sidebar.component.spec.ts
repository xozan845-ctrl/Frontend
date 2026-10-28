import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { CompanySidebarComponent } from './company-sidebar.component';
import { workspaceModuleGroups } from '../../../../../core/workspace/constants/workspace-modules.constants';

describe('CompanySidebarComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('muestra operación y administración sin mezclar el panel vendedor', async () => {
    await TestBed.configureTestingModule({
      imports: [CompanySidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanySidebarComponent);
    fixture.componentRef.setInput(
      'groups',
      workspaceModuleGroups('company', () => true),
    );
    fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.css('a[data-testid^="company-nav-"]'));

    expect(links.map((link) => link.nativeElement.textContent.trim())).toContain('Dashboard');
    expect(links.map((link) => link.nativeElement.textContent.trim())).toContain('Vendedores');
    expect(fixture.nativeElement.textContent).toContain('Logística');
    expect(fixture.nativeElement.textContent).not.toContain('Mi empresa');
  });
});
