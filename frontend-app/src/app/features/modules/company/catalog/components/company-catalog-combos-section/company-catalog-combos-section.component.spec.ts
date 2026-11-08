import { TestBed } from '@angular/core/testing';
import CompanyCatalogCombosSectionComponent from './company-catalog-combos-section.component';

describe('CompanyCatalogCombosSectionComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyCatalogCombosSectionComponent],
    }).compileComponents();
    return TestBed.createComponent(CompanyCatalogCombosSectionComponent);
  };

  it('emite la creación de combo', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.create.subscribe(created);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="new-combo"]')
      ?.click();

    expect(created).toHaveBeenCalled();
  });
});
