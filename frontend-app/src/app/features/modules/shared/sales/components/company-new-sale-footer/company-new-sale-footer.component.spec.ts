import { TestBed } from '@angular/core/testing';
import CompanyNewSaleFooterComponent from './company-new-sale-footer.component';

describe('CompanyNewSaleFooterComponent', () => {
  it('emite siguiente y anterior según el paso', async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyNewSaleFooterComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyNewSaleFooterComponent);
    const next = vi.fn();
    const previous = vi.fn();
    fixture.componentInstance.next.subscribe(next);
    fixture.componentInstance.previous.subscribe(previous);
    fixture.componentRef.setInput('step', 2);
    fixture.componentRef.setInput('hasItems', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('[data-testid="new-sale-next"]')?.click();
    host.querySelector<HTMLButtonElement>('[data-testid="new-sale-previous"]')?.click();

    expect(next).toHaveBeenCalled();
    expect(previous).toHaveBeenCalled();
  });
});
