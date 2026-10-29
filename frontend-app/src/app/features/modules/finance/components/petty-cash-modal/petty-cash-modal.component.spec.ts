import { TestBed } from '@angular/core/testing';
import type { PettyCashFund } from '../../../../domains/finance/public-api';
import { PettyCashModalComponent } from './petty-cash-modal.component';

const FUND: PettyCashFund = { amount: 0, responsible: '', updatedAt: '2026-10-20T12:00:00Z' };

describe('PettyCashModalComponent', () => {
  const setup = async (mode: 'movement' | 'fund') => {
    await TestBed.configureTestingModule({
      imports: [PettyCashModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PettyCashModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('defaultType', 'gasto');
    fixture.componentRef.setInput('fund', FUND);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe guardar el fondo de caja chica', async () => {
    const fixture = await setup('fund');
    const host = fixture.nativeElement as HTMLElement;
    const save = vi.fn();
    fixture.componentInstance.saveFund.subscribe(save);

    const amount = host.querySelector('[data-testid="petty-amount"]') as HTMLInputElement;
    amount.value = '1000';
    amount.dispatchEvent(new Event('input'));
    (host.querySelector('[data-testid="petty-save"]') as HTMLButtonElement).click();

    expect(save).toHaveBeenCalledWith({ amount: 1000, responsible: '' });
  });

  it('debe registrar un gasto de caja chica', async () => {
    const fixture = await setup('movement');
    const host = fixture.nativeElement as HTMLElement;
    const save = vi.fn();
    fixture.componentInstance.saveMovement.subscribe(save);

    const concept = host.querySelector('[data-testid="petty-concept"]') as HTMLInputElement;
    concept.value = 'Café';
    concept.dispatchEvent(new Event('input'));
    const amount = host.querySelector('[data-testid="petty-amount"]') as HTMLInputElement;
    amount.value = '100';
    amount.dispatchEvent(new Event('input'));
    (host.querySelector('[data-testid="petty-save"]') as HTMLButtonElement).click();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'gasto', concept: 'Café', amount: 100 }),
    );
  });
});
