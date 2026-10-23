import {
  adaptParadaFromBackend,
  adaptRutaFromBackend,
  adaptRutasFromBackend,
} from './ruta.adapter';
import { RUTAS_FIXTURE } from '../fixtures/ruta.fixture';

describe('ruta.adapter', () => {
  it('debe normalizar una ruta con sus paradas ordenadas', () => {
    const route = adaptRutaFromBackend(RUTAS_FIXTURE[0]);

    expect(route).toMatchObject({
      id: 'ruta-1',
      name: 'Ruta Centro',
      status: 'pendiente',
      assignedPersonalIds: ['personal-1'],
      assignedVehicleId: 'vehiculo-1',
    });
    expect(route?.stops).toHaveLength(2);
    expect(route?.stops[0]).toMatchObject({
      id: 'parada-1',
      order: 1,
      name: 'Farmacia Central',
      completed: false,
      type: 'cliente',
    });
    expect(route?.stops[1].completed).toBe(true);
  });

  it('debe tolerar camelCase y ordenar paradas', () => {
    const route = adaptRutaFromBackend({
      id: 'ruta-2',
      nombre: 'Ruta Sur',
      estado: 'en_curso',
      personalAsignadoIds: ['p-1'],
      vehiculoAsignadoId: 'v-1',
      fechaInicio: '2026-10-24T08:00:00.000Z',
      paradas: [
        { id: 'p-2', orden: 2, nombre: 'Segunda' },
        { id: 'p-1', orden: 1, nombre: 'Primera' },
      ],
    });

    expect(route).toMatchObject({ id: 'ruta-2', status: 'en_curso', assignedVehicleId: 'v-1' });
    expect(route?.stops.map((stop) => stop.id)).toEqual(['p-1', 'p-2']);
  });

  it('debe tolerar envelopes y descartar registros sin id', () => {
    expect(adaptRutasFromBackend({ data: RUTAS_FIXTURE })).toHaveLength(1);
    expect(adaptRutasFromBackend([{ nombre: 'sin id' }])).toEqual([]);
    expect(adaptRutasFromBackend(null)).toEqual([]);
    expect(adaptParadaFromBackend({ nombre: 'sin id' }, 'ruta-1')).toBeNull();
  });
});
