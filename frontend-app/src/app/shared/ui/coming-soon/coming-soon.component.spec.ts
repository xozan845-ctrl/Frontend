import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import ComingSoonComponent from './coming-soon.component';
import { SeoService } from '../../../core/services/seo/seo.service';

describe('ComingSoonComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async (title = 'Reportes', context = 'Panel del vendedor') => {
    await TestBed.configureTestingModule({
      imports: [ComingSoonComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ComingSoonComponent);
    fixture.componentRef.setInput('title', title);
    fixture.componentRef.setInput('context', context);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar el título de la sección y el estado "En construcción"', async () => {
    const fixture = await setup('Reportes');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Reportes');
    expect(text).toContain('En construcción');
    expect(fixture.nativeElement.querySelector('[data-testid="coming-soon"]')).not.toBeNull();
  });

  it('debe aplicar el SEO de la sección con su módulo y restaurarlo al salir (R-UX-6)', async () => {
    const fixture = await setup('Inventario', 'Panel del vendedor');

    expect(seo.setPage).toHaveBeenCalledWith('Inventario — Panel del vendedor', expect.any(String));

    fixture.destroy();
    expect(seo.reset).toHaveBeenCalled();
  });
});
