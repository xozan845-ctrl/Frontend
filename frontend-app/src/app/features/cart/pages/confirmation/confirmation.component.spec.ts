import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { ProductStore } from '../../../products/state/product.store';
import { ConfirmationComponent } from './confirmation.component';

const order = {
  id: 'ord-1',
  orderNumber: 'ORD-123456',
  status: 'creada',
  total: 2760,
  createdAt: '2026-10-08T10:00:00.000Z',
};

describe('ConfirmationComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
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
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => sessionStorage.clear());

  it('debe mostrar la orden real (id, estado y total)', async () => {
    sessionStorage.setItem('ecom_last_order', JSON.stringify(order));

    const fixture = await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('ORD-123456');
    expect(text).toContain('creada');
    expect(text).toContain('C$2,760.00');
    expect(seo.setPage).toHaveBeenCalledWith(
      'Pedido confirmado',
      'Tu pedido en Quantum Store fue confirmado.',
    );
  });

  it('debe mostrar el estado vacío cuando no hay orden reciente', async () => {
    const fixture = await setup();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin orden');
  });
});
