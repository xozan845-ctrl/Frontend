import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { ProductStore } from '../../../products/state/product.store';
import { ConfirmationComponent } from './confirmation.component';

describe('ConfirmationComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  beforeEach(() => vi.clearAllMocks());

  it('debe mostrar la confirmación y un número de orden con formato válido', async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationComponent],
      providers: [
        provideRouter([]),
        { provide: SeoService, useValue: seo },
        { provide: ProductStore, useValue: { storeId: () => 'tienda-1' } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConfirmationComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Orden');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Confirmada');
    expect(component.orderNumber).toMatch(/^ORD-\d{6}$/);
    expect(seo.setPage).toHaveBeenCalledWith(
      'Pedido confirmado',
      'Tu pedido en Quantum Store fue confirmado.',
    );
  });
});
