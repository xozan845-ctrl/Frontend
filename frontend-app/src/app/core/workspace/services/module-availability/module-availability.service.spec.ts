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
});
