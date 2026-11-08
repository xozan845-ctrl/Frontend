import { TestBed } from '@angular/core/testing';
import CompanySettingsSummaryComponent from './company-settings-summary.component';

describe('CompanySettingsSummaryComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanySettingsSummaryComponent],
    }).compileComponents();
    return TestBed.createComponent(CompanySettingsSummaryComponent);
  };

  it('muestra el resumen de la empresa', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('company', {
      id: 'c-1',
      name: 'Mi Empresa',
      commercialName: 'Mi Empresa',
      legalName: 'Mi Empresa S.A.',
      slug: 'mi-empresa',
      type: 'comercial',
      logisticsMode: 'propia',
      status: 'activa',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mi Empresa');
  });
});
