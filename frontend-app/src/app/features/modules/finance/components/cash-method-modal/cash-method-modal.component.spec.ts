import { TestBed } from '@angular/core/testing';
import { CashMethodModalComponent } from './cash-method-modal.component';

describe('CashMethodModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashMethodModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashMethodModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir el método configurado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const save = vi.fn();
    fixture.componentInstance.save.subscribe(save);

    const name = host.querySelector('[data-testid="cash-method-name"]') as HTMLInputElement;
    name.value = 'Cheque';
    name.dispatchEvent(new Event('input'));
    (host.querySelector('#cash-method-kind') as HTMLSelectElement).value = 'cheque';
    (host.querySelector('#cash-method-kind') as HTMLSelectElement).dispatchEvent(
      new Event('change'),
    );
    (host.querySelector('[data-testid="cash-method-save"]') as HTMLButtonElement).click();

    expect(save).toHaveBeenCalledWith({ name: 'Cheque', kind: 'cheque' });
  });
});
