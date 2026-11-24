import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { RuntimePackageConfig } from '../../../config/runtime-config.model';
import { RuntimeConfigService } from '../../../config/runtime-config.service';
import { ModuleAvailabilityService } from './module-availability.service';

describe('ModuleAvailabilityService', () => {
  const setup = (paquete: RuntimePackageConfig): ModuleAvailabilityService => {
    TestBed.configureTestingModule({
      providers: [
        ModuleAvailabilityService,
        {
          provide: RuntimeConfigService,
          useValue: { packageConfig: signal<RuntimePackageConfig>(paquete) },
        },
      ],
    });
    return TestBed.inject(ModuleAvailabilityService);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe resolver la disponibilidad desde el paquete compartido cuando cambia la configuración', () => {
    const service = setup({ id: 'tienda', capabilities: ['workspace.store'] });

    const habilitado = service.resolve({
      status: 'integrado',
      requiredCapabilities: ['workspace.store'],
    });
    const bloqueado = service.resolve({
      status: 'validado',
      requiredCapabilities: ['workspace.logistics'],
    });

    expect(habilitado.available).toBe(true);
    expect(habilitado.operational).toBe(true);
    expect(bloqueado.available).toBe(false);
    expect(bloqueado.reason).toBe('capability-missing');
  });

  it('debe exponer el paquete vigente sin duplicar la configuración', () => {
    const service = setup({ id: 'logistica', capabilities: ['workspace.logistics'] });

    expect(service.packageConfig()).toEqual({
      id: 'logistica',
      capabilities: ['workspace.logistics'],
    });
  });

  it('debe dar al menú solo los módulos disponibles en el paquete contratado', () => {
    const service = setup({ id: 'tienda', capabilities: ['module:store.sales'] });

    const ids = service
      .groupsFor('store', () => true)
      .flatMap((group) => group.items.map((item) => item.id));

    expect(ids).toEqual(['store.sales']);
  });

  it('debe reutilizar el mismo registro con otro paquete sin condicionales por empresa', () => {
    const service = setup({
      id: 'tienda-con-facturacion',
      capabilities: ['module:store.sales', 'module:store.billing'],
    });

    const ids = service
      .groupsFor('store', () => true)
      .flatMap((group) => group.items.map((item) => item.id));

    expect(ids).toEqual(['store.sales', 'store.billing']);
    expect(
      service.resolve({ status: 'demo', requiredCapabilities: ['module:store.billing'] }),
    ).toMatchObject({ available: true, operational: false, label: 'Demo' });
  });

  it('debe ocultar los módulos en desarrollo incluso con comodín local', () => {
    const service = setup({ id: 'local', capabilities: ['*'] });

    const ids = service
      .groupsFor('company', () => true)
      .flatMap((group) => group.items.map((item) => item.id));

    expect(ids).toContain('company.sales');
    expect(ids).not.toContain('company.payroll');
    expect(ids).not.toContain('company.taxes');
  });
});
