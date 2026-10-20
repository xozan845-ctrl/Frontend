import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import LogisticaShellComponent from './logistica-shell.component';

describe('LogisticaShellComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticaShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(LogisticaShellComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe abrir el drawer móvil con el botón y cerrarlo con Escape (R-UX-2, R-AC-3)', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector(
      '[data-testid="logistica-sidebar-toggle"]',
    ) as HTMLButtonElement;

    expect(fixture.componentInstance.isSidebarOpen()).toBe(false);

    toggle.click();
    expect(fixture.componentInstance.isSidebarOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.isSidebarOpen()).toBe(false);
  });
});
