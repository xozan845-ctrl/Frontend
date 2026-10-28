import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import BillingShellComponent from './billing-shell.component';

describe('BillingShellComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [BillingShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(BillingShellComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe abrir el drawer móvil y cerrarlo con Escape', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector(
      '[data-testid="billing-sidebar-toggle"]',
    ) as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
