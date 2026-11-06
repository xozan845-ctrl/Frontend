import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import AdminShellComponent from './admin-shell.component';
import { AuthStore } from '../../../auth/public-api';

describe('AdminShellComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [provideRouter([]), { provide: AuthStore, useValue: { user: () => null } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminShellComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe abrir el drawer móvil y cerrarlo con Escape', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector('[data-testid="admin-sidebar-toggle"]') as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
