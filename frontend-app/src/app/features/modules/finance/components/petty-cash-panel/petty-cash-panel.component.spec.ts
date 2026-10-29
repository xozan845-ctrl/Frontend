import { TestBed } from '@angular/core/testing';
import type {
  PettyCashFund,
  PettyCashMovement,
  PettyCashSummary,
} from '../../../../domains/finance/public-api';
import { PettyCashPanelComponent } from './petty-cash-panel.component';

const FUND: PettyCashFund = {
  amount: 1000,
  responsible: 'Karla',
  updatedAt: '2026-10-20T12:00:00Z',
};
const SUMMARY: PettyCashSummary = {
  fund: 1000,
  replenishments: 0,
  expenses: 100,
  balance: 900,
  movementsCount: 1,
};
const MOVEMENT: PettyCashMovement = {
  id: 'petty-1',
  date: '2026-10-20',
  type: 'gasto',
  concept: 'Café',
  amount: 100,
  createdAt: '2026-10-20T12:00:00Z',
};

describe('PettyCashPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PettyCashPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PettyCashPanelComponent);
    fixture.componentRef.setInput('summary', SUMMARY);
    fixture.componentRef.setInput('movements', [MOVEMENT]);
    fixture.componentRef.setInput('fund', FUND);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar el fondo y emitir el alta de gasto', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const open = vi.fn();
    fixture.componentInstance.openMovement.subscribe(open);

    expect(host.textContent).toContain('Café');
    expect(host.textContent).toContain('900.00');
    (host.querySelector('[data-testid="petty-expense"]') as HTMLButtonElement).click();
    expect(open).toHaveBeenCalledWith('gasto');
  });
});
