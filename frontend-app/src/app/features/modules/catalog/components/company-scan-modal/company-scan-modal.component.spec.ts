import { TestBed } from '@angular/core/testing';
import { CompanyScanModalComponent } from './company-scan-modal.component';
import type { CompanyScanResult } from '../../../../applications/empresas/public-api';

const result: CompanyScanResult = {
  kind: 'servicio',
  product: null,
  service: {
    id: 'srv-1',
    companyId: 'e-1',
    code: 'SRV-1',
    name: 'Soporte',
    description: '',
    category: '',
    brand: '',
    barcode: '',
    price: 100,
    cost: 0,
    unit: 'Hora (h)',
    durationMinutes: 60,
    status: 'activo',
    createdAt: '',
    updatedAt: '',
  },
};

describe('CompanyScanModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyScanModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyScanModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    return fixture;
  };

  it('debe emitir el código y el resultado editable', async () => {
    const fixture = await setup();
    const scanned = vi.fn();
    const edited = vi.fn();
    fixture.componentInstance.scan.subscribe(scanned);
    fixture.componentInstance.edit.subscribe(edited);

    fixture.componentInstance.code.set('750');
    fixture.componentInstance.submit();
    expect(scanned).toHaveBeenCalledWith('750');

    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Soporte');
    fixture.componentInstance.editResult();
    expect(edited).toHaveBeenCalledWith(result);
  });

  it('no debe buscar códigos vacíos y debe cerrar', async () => {
    const fixture = await setup();
    const scanned = vi.fn();
    const dismissed = vi.fn();
    fixture.componentInstance.scan.subscribe(scanned);
    fixture.componentInstance.dismiss.subscribe(dismissed);

    fixture.componentInstance.submit();
    expect(scanned).not.toHaveBeenCalled();
    fixture.componentInstance.close();
    expect(dismissed).toHaveBeenCalled();
  });
});
