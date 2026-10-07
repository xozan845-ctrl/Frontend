import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import NotFoundComponent from './not-found.component';

describe('NotFoundComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  beforeEach(() => vi.clearAllMocks());

  it('debe mostrar el estado 404 y actualizar el SEO', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '404 - Página no encontrada',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Volver al Inicio');
    expect(seo.setPage).toHaveBeenCalledWith(
      'Página no encontrada',
      'La página que buscas no existe o fue movida.',
    );
  });
});
