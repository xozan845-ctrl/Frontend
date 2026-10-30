import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import VendorShellComponent from './vendor-shell.component';
import { WorkspaceSidebarComponent } from '../../../../../shared/ui/workspace-sidebar/workspace-sidebar.component';
import { AuthStore } from '../../../auth/public-api';
import { BrandingService } from '../../../../../core/services/branding/branding.service';
import { VendorStoreStore } from '../../state/vendor-store/vendor-store.store';
import type { Store } from '../../../products/public-api';

describe('VendorShellComponent', () => {
  const store = signal<Store | null>(null);
  const vendorStore = {
    store: store.asReadonly(),
    load: vi.fn(),
  };
  const branding = { setLogo: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [VendorShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { user: signal(null) } },
        { provide: VendorStoreStore, useValue: vendorStore },
        { provide: BrandingService, useValue: branding },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(VendorShellComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.set(null);
    TestBed.resetTestingModule();
  });

  it('debe montar el sidebar y el outlet del panel', async () => {
    const fixture = await setup();

    expect(fixture.debugElement.query(By.directive(WorkspaceSidebarComponent))).toBeTruthy();
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

    const sidebar = fixture.debugElement.query(By.directive(WorkspaceSidebarComponent))
      .componentInstance as WorkspaceSidebarComponent;
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

  it('debe aplicar el logo de la tienda a la pestaña', async () => {
    store.set({
      id: 't-1',
      vendorId: 'u-1',
      name: 'Mi Tienda',
      description: '',
      logoUrl: 'https://cdn.test/tienda.png',
    });
    await setup();

    expect(branding.setLogo).toHaveBeenCalledWith('https://cdn.test/tienda.png');
  });

  it('debe restaurar el icono al salir del panel', async () => {
    const fixture = await setup();
    fixture.destroy();

    expect(branding.reset).toHaveBeenCalled();
  });
});
