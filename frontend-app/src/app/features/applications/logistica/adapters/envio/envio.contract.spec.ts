import { adaptShipmentsFromBackend } from './envio.adapter';
import { SHIPMENTS_FIXTURE } from '../fixtures/envio.fixture';

// R-C-8: contrato contra `EnvioConMontoResponseDto` versionado.
describe('envio.contract', () => {
  it('normaliza los envíos del gateway', () => {
    const [shipment] = adaptShipmentsFromBackend({ data: SHIPMENTS_FIXTURE });

    expect(shipment).toMatchObject({
      id: 'e-1',
      orderId: 'o-1',
      companyId: 'emp-1',
      logisticsMode: 'hibrida',
      status: 'en_preparacion',
      amount: 2300,
      createdAt: '2026-10-22T15:00:00.000Z',
    });
  });
});
