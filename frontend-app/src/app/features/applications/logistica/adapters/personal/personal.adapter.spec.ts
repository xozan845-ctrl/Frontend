import { adaptPersonalFromBackend, adaptPersonalListFromBackend } from './personal.adapter';
import { PERSONAL_FIXTURE } from '../fixtures/personal.fixture';

describe('personal.adapter', () => {
  it('debe normalizar un colaborador completo', () => {
    expect(adaptPersonalFromBackend(PERSONAL_FIXTURE[0])).toEqual({
      id: 'personal-1',
      name: 'Ana',
      lastName: 'Pérez',
      cargo: 'conductor',
      status: 'en_ruta',
      phone: '+505 7777 2222',
      email: 'ana@tienda.test',
      assignedRouteId: 'ruta-1',
      assignedVehicleId: 'vehiculo-1',
      checkIn: '2026-10-23T08:00:00.000Z',
      checkOut: null,
      lat: 12.136,
      lng: -86.251,
      locationTimestamp: '2026-10-23T10:30:00.000Z',
      createdAt: '2026-10-21T10:00:00.000Z',
      updatedAt: '2026-10-23T10:30:00.000Z',
    });
  });

  it('debe tolerar camelCase y datos opcionales', () => {
    expect(
      adaptPersonalFromBackend({
        id: 'personal-3',
        nombre: 'Marta',
        cargo: 'supervisor',
        estado: 'activo',
        rutaAsignadaId: 'ruta-2',
        ubicacionLat: '12.5',
        ubicacionLng: '-86.2',
      }),
    ).toMatchObject({
      id: 'personal-3',
      name: 'Marta',
      assignedRouteId: 'ruta-2',
      lat: 12.5,
      lng: -86.2,
    });
  });

  it('debe tolerar envelopes y descartar sin id', () => {
    expect(adaptPersonalListFromBackend({ data: PERSONAL_FIXTURE })).toHaveLength(2);
    expect(adaptPersonalListFromBackend([{ nombre: 'sin id' }])).toEqual([]);
    expect(adaptPersonalListFromBackend(null)).toEqual([]);
  });
});
