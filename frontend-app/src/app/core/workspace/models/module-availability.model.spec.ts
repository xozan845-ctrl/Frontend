import type { RuntimePackageConfig } from '../../config/runtime-config.model';
import {
  MODULE_AVAILABILITY_LABELS,
  resolveModuleAvailability,
  type ModuleAvailabilityStatus,
} from './module-availability.model';

describe('resolveModuleAvailability', () => {
  const integrado = {
    status: 'integrado' as const,
    requiredCapabilities: ['billing.emit'],
  };

  it('debe permitir navegar y operar un módulo integrado cuando el paquete tiene su capacidad', () => {
    const availability = resolveModuleAvailability(integrado, {
      id: 'completo',
      capabilities: ['billing.emit'],
    });

    expect(availability.available).toBe(true);
    expect(availability.operational).toBe(true);
    expect(availability.reason).toBeNull();
    expect(availability.missingCapabilities).toEqual([]);
  });

  it('debe bloquear un módulo validado cuando falta una capacidad del paquete', () => {
    const availability = resolveModuleAvailability(
      { status: 'validado', requiredCapabilities: ['billing.emit', 'reports.export'] },
      { id: 'basico', capabilities: ['billing.emit'] },
    );

    expect(availability.available).toBe(false);
    expect(availability.operational).toBe(false);
    expect(availability.reason).toBe('capability-missing');
    expect(availability.missingCapabilities).toEqual(['reports.export']);
  });

  it('debe mantener visible pero no operativo un módulo demo cuando el paquete lo habilita', () => {
    const availability = resolveModuleAvailability(
      { status: 'demo' },
      {
        id: 'demo',
        capabilities: [],
      },
    );

    expect(availability.available).toBe(true);
    expect(availability.operational).toBe(false);
    expect(availability.reason).toBe('demo');
  });

  it('debe deshabilitar un módulo en desarrollo aunque el paquete tenga su capacidad', () => {
    const availability = resolveModuleAvailability(
      { status: 'en desarrollo', requiredCapabilities: ['logistics.map'] },
      { id: 'completo', capabilities: ['logistics.map'] },
    );

    expect(availability.available).toBe(false);
    expect(availability.operational).toBe(false);
    expect(availability.reason).toBe('in-development');
  });

  it('debe mostrar la etiqueta exacta de los cuatro estados', () => {
    const estados: readonly ModuleAvailabilityStatus[] = [
      'demo',
      'en desarrollo',
      'integrado',
      'validado',
    ];

    expect(MODULE_AVAILABILITY_LABELS).toEqual({
      demo: 'Demo',
      'en desarrollo': 'En desarrollo',
      integrado: 'Integrado',
      validado: 'Validado',
    });
    for (const status of estados) {
      expect(resolveModuleAvailability({ status }, undefined).label).toBe(
        MODULE_AVAILABILITY_LABELS[status],
      );
    }
  });

  it('debe permitir módulos sin capacidades cuando el paquete no declara capacidades', () => {
    const availability = resolveModuleAvailability({ status: 'integrado' }, undefined);

    expect(availability.available).toBe(true);
    expect(availability.operational).toBe(true);
    expect(availability.reason).toBeNull();
  });

  it('debe tratar el comodín del paquete como capacidad satisfita', () => {
    const paquete: RuntimePackageConfig = { id: 'local', capabilities: ['*'] };

    const availability = resolveModuleAvailability(integrado, paquete);

    expect(availability.available).toBe(true);
    expect(availability.operational).toBe(true);
    expect(availability.missingCapabilities).toEqual([]);
  });
});
