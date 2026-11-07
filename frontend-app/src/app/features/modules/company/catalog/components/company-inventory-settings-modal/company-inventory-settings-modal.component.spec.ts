import { TestBed } from '@angular/core/testing';
import { CompanyInventorySettingsModalComponent } from './company-inventory-settings-modal.component';

describe('CompanyInventorySettingsModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyInventorySettingsModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInventorySettingsModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    return fixture;
  };

  it('debe emitir la configuración al guardar', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);

    fixture.componentInstance.form.patchValue({ costMethod: 'fifo', defaultUnit: 'Caja' });
    fixture.componentInstance.submit();

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({ costMethod: 'fifo', defaultUnit: 'Caja' }),
    );
  });

  it('debe cargar los valores existentes y cerrar', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('settings', {
      companyId: 'e-1',
      costMethod: 'ueps',
      allowNegativeStock: true,
      lowStockAlert: false,
      updateCostOnPurchase: false,
      defaultUnit: 'Libra (lb)',
      updatedAt: '',
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      costMethod: 'ueps',
      defaultUnit: 'Libra (lb)',
    });

    const dismissed = vi.fn();
    fixture.componentInstance.dismiss.subscribe(dismissed);
    fixture.componentInstance.close();
    expect(dismissed).toHaveBeenCalled();
  });
});
