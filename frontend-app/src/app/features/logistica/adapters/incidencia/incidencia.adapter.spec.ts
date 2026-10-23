import { adaptIncidenciaFromBackend, adaptIncidenciasFromBackend } from './incidencia.adapter';
import { INCIDENCIAS_FIXTURE } from '../fixtures/incidencia.fixture';

describe('incidencia.adapter', () => {
  it('debe normalizar una incidencia completa', () => {
    expect(adaptIncidenciaFromBackend(INCIDENCIAS_FIXTURE[0])).toEqual({
      id: 'incidencia-1',
      type: 'mecanica',
      status: 'abierta',
      description: 'Llanta pinchada en la ruta centro.',
      personalId: 'personal-1',
      vehicleId: 'vehiculo-1',
      routeId: 'ruta-1',
      resolution: '',
      createdAt: '2026-10-23T09:00:00.000Z',
      updatedAt: '2026-10-23T09:00:00.000Z',
    });
  });

  it('debe tolerar camelCase y campos opcionales', () => {
    expect(
      adaptIncidenciaFromBackend({
        id: 'incidencia-3',
        tipo: 'otro',
        estado: 'en_progreso',
        descripcion: 'Demora',
        rutaId: 'ruta-2',
        resolucion: 'En revisión',
      }),
    ).toMatchObject({ id: 'incidencia-3', status: 'en_progreso', routeId: 'ruta-2' });
  });

  it('debe tolerar envelopes y descartar sin id', () => {
    expect(adaptIncidenciasFromBackend({ data: INCIDENCIAS_FIXTURE })).toHaveLength(2);
    expect(adaptIncidenciasFromBackend([{ descripcion: 'sin id' }])).toEqual([]);
    expect(adaptIncidenciasFromBackend(null)).toEqual([]);
  });
});
