import { adaptIncidenciasFromBackend } from './incidencia.adapter';
import { INCIDENCIAS_FIXTURE } from '../fixtures/incidencia.fixture';

// R-C-8: contrato contra `IncidenciaResponseDto` versionado.
describe('incidencia.contract', () => {
  it('normaliza incidencias y relaciones opcionales', () => {
    const [incident] = adaptIncidenciasFromBackend({ data: INCIDENCIAS_FIXTURE });

    expect(incident).toMatchObject({
      id: 'incidencia-1',
      type: 'mecanica',
      status: 'abierta',
      personalId: 'personal-1',
      vehicleId: 'vehiculo-1',
      routeId: 'ruta-1',
      createdAt: '2026-10-23T09:00:00.000Z',
    });
  });
});
