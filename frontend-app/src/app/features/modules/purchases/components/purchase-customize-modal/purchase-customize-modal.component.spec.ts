import { TestBed } from '@angular/core/testing';
import { PurchaseCustomizeModalComponent } from './purchase-customize-modal.component';
import type { PurchaseDocumentSettings } from '../../../../domains/purchases/public-api';

const SETTINGS: PurchaseDocumentSettings = {
  logoSize: 'mediano',
  headerColor: '#0055FF',
  matchTableColor: true,
  footerMessage: '',
  showRuc: true,
  showAddress: true,
  showPhone: true,
};

describe('PurchaseCustomizeModalComponent', () => {
  const setup = async (open = true) => {
    await TestBed.configureTestingModule({
      imports: [PurchaseCustomizeModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseCustomizeModalComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('settings', SETTINGS);
    fixture.componentRef.setInput('companyName', 'Mi Empresa');
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('emite las preferencias saneadas al guardar', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);
    fixture.componentInstance.form.patchValue({
      logoSize: 'grande',
      headerColor: '#abcdef',
      footerMessage: '  Gracias  ',
      showRuc: false,
    });
    fixture.componentInstance.submit();

    expect(saved).toHaveBeenCalledWith({
      logoSize: 'grande',
      headerColor: '#ABCDEF',
      matchTableColor: true,
      footerMessage: 'Gracias',
      showRuc: false,
      showAddress: true,
      showPhone: true,
    });
  });

  it('no guarda con un color inválido', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);
    fixture.componentInstance.form.patchValue({ headerColor: 'rojo' });
    fixture.componentInstance.submit();
    expect(saved).not.toHaveBeenCalled();
  });

  it('no renderiza el diálogo cuando está cerrado', async () => {
    const fixture = await setup(false);
    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-customize-dialog"]'),
    ).toBeNull();
  });
});
