import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import VendorShellComponent from './vendor-shell.component';
import { VendorSidebarComponent } from '../../components/vendor-sidebar/vendor-sidebar.component';

describe('VendorShellComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [VendorShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(VendorShellComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe montar el sidebar y el outlet del panel', async () => {
    const fixture = await setup();

    expect(fixture.debugElement.query(By.directive(VendorSidebarComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('router-outlet'))).toBeTruthy();
  });

  it('debe abrir el drawer móvil y cerrarlo al elegir un ítem', async () => {
    const fixture = await setup();
    expect(fixture.componentInstance.isSidebarOpen()).toBe(false);

    const toggle = fixture.debugElement.query(By.css('[data-testid="vendor-sidebar-toggle"]'));
    toggle.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSidebarOpen()).toBe(true);
    expect(toggle.nativeElement.getAttribute('aria-expanded')).toBe('true');

    const sidebar = fixture.debugElement.query(By.directive(VendorSidebarComponent))
      .componentInstance as VendorSidebarComponent;
    sidebar.itemSelected.emit();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSidebarOpen()).toBe(false);
  });

  it('debe cerrar el drawer con Escape (R-AC-3)', async () => {
    const fixture = await setup();
    fixture.componentInstance.isSidebarOpen.set(true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isSidebarOpen()).toBe(false);
  });
});
