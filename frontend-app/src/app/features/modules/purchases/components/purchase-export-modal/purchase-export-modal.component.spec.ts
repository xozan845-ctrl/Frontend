import { TestBed } from '@angular/core/testing';
import { PurchaseExportModalComponent } from './purchase-export-modal.component';
import type {
  PurchaseDocumentSettings,
  PurchaseRecord,
  Supplier,
} from '../../../../domains/purchases/public-api';

function localDate(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const RECORD: PurchaseRecord = {
  id: 'purchase-1',
  number: 'C-0001',
  date: localDate(),
  supplierId: 'supplier-1',
  supplierName: 'Distribuidora',
  paymentMethod: 'efectivo',
  status: 'recibida',
  origin: 'productos',
  costType: 'inventario',
  lines: [
    {
      id: 'line-1',
      productId: 'product-1',
      name: 'Taladro',
      sku: 'TAL-1',
      quantity: 2,
      unitCost: 100,
      salePrice: 150,
    },
  ],
  subtotal: 200,
  retention: 0,
  total: 200,
  notes: '',
  userName: 'Karla',
  createdAt: `${localDate()}T12:00:00.000Z`,
};

const SUPPLIER: Supplier = {
  id: 'supplier-1',
  name: 'Distribuidora',
  ruc: '',
  phone: '',
  email: '',
  address: '',
  createdAt: `${localDate()}T12:00:00.000Z`,
};

const SETTINGS: PurchaseDocumentSettings = {
  logoSize: 'mediano',
  headerColor: '#0055FF',
  matchTableColor: true,
  footerMessage: '',
  showRuc: true,
  showAddress: true,
  showPhone: true,
};

describe('PurchaseExportModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseExportModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseExportModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('records', [RECORD]);
    fixture.componentRef.setInput('suppliers', [SUPPLIER]);
    fixture.componentRef.setInput('settings', SETTINGS);
    fixture.componentRef.setInput('companyName', 'Mi Empresa');
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('resume las compras filtradas y responde a los filtros', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    expect(component.report().count).toBe(1);
    expect(component.report().total).toBe(200);

    component.setStatus('anuladas');
    expect(component.report().count).toBe(0);
    component.setStatus('todas');
    expect(component.report().count).toBe(1);

    component.toggleSupplier('supplier-1', { target: { checked: true } } as never);
    expect(component.selectedSupplierIds()).toEqual(['supplier-1']);
    component.clearSuppliers();
    expect(component.selectedSupplierIds()).toEqual([]);
  });

  it('muestra el resumen y deshabilita la descarga sin resultados', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.setStatus('anuladas');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      '[data-testid="purchase-export-excel"], [data-testid="purchase-export-pdf"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(Array.from(buttons).every((button) => button.disabled)).toBe(true);
    expect(component.report().total).toBe(0);
  });
});
