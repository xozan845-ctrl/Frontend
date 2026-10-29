import { TestBed } from '@angular/core/testing';
import type { CashClosurePreview } from '../../../../domains/finance/public-api';
import { CashClosuresPanelComponent } from './cash-closures-panel.component';

const PREVIEW: CashClosurePreview = {
  date: '2026-10-29',
  openingBalance: 300,
  income: 200,
  expense: 50,
  expectedBalance: 450,
  movementsCount: 2,
  existing: null,
};

describe('CashClosuresPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashClosuresPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashClosuresPanelComponent);
    fixture.componentRef.setInput('preview', PREVIEW);
    fixture.componentRef.setInput('closures', []);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar el arqueo y solicitar el cierre', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const close = vi.fn();
    fixture.componentInstance.requestClose.subscribe(close);

    expect(host.textContent).toContain('450.00');
    expect(host.textContent).toContain('2 movimientos');
    (host.querySelector('[data-testid="closure-open"]') as HTMLButtonElement).click();
    expect(close).toHaveBeenCalled();
  });
});
