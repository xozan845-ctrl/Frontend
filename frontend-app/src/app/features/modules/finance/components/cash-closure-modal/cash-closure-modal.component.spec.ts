import { TestBed } from '@angular/core/testing';
import type { CashClosurePreview } from '../../../../domains/finance/public-api';
import { CashClosureModalComponent } from './cash-closure-modal.component';

const PREVIEW: CashClosurePreview = {
  date: '2026-10-29',
  openingBalance: 300,
  income: 200,
  expense: 50,
  expectedBalance: 450,
  movementsCount: 2,
  existing: null,
};

describe('CashClosureModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashClosureModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashClosureModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('preview', PREVIEW);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe calcular la diferencia y emitir el cierre', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const save = vi.fn();
    fixture.componentInstance.save.subscribe(save);

    const counted = host.querySelector('[data-testid="cash-closure-counted"]') as HTMLInputElement;
    counted.value = '440';
    counted.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.difference()).toBe(-10);

    (host.querySelector('[data-testid="cash-closure-save"]') as HTMLButtonElement).click();
    expect(save).toHaveBeenCalledWith({
      date: '2026-10-29',
      countedBalance: 440,
      notes: '',
    });
  });
});
