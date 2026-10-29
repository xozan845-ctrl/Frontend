import { adaptRutasFromBackend } from './ruta.adapter';
import { RUTAS_FIXTURE } from '../fixtures/ruta.fixture';

// R-C-8: contrato contra `RutaResponseDto` y `ParadaResponseDto` versionados.
describe('ruta.contract', () => {
  it('normaliza ruta, asignaciones y paradas del gateway', () => {
    const [route] = adaptRutasFromBackend({ data: RUTAS_FIXTURE });

    expect(route).toMatchObject({
      id: 'ruta-1',
      name: 'Ruta Centro',
      status: 'pendiente',
      assignedPersonalIds: ['personal-1'],
      assignedVehicleId: 'vehiculo-1',
    });
    expect(route.stops[0]).toMatchObject({
      id: 'parada-1',
      routeId: 'ruta-1',
      order: 1,
      name: 'Farmacia Central',
      completed: false,
    });
  });
});
