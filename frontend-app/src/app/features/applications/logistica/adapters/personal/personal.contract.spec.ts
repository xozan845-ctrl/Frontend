import { adaptPersonalListFromBackend } from './personal.adapter';
import { PERSONAL_FIXTURE } from '../fixtures/personal.fixture';

// R-C-8: contrato contra `PersonalResponseDto` versionado.
describe('personal.contract', () => {
  it('normaliza personal, ubicación y fechas ISO del gateway', () => {
    const [person] = adaptPersonalListFromBackend({ data: PERSONAL_FIXTURE });

    expect(person).toMatchObject({
      id: 'personal-1',
      name: 'Ana',
      lastName: 'Pérez',
      assignedRouteId: 'ruta-1',
      assignedVehicleId: 'vehiculo-1',
      lat: 12.136,
      lng: -86.251,
      updatedAt: '2026-10-23T10:30:00.000Z',
    });
  });
});
