import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanyShellComponent from './company-shell.component';

describe('CompanyShellComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('abre el drawer móvil y lo cierra con Escape', async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyShellComponent);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="company-sidebar-toggle"]',
    ) as HTMLButtonElement;

    toggle.click();
    expect(fixture.componentInstance.isSidebarOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.isSidebarOpen()).toBe(false);
  });
});
