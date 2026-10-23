import { adaptShipmentFromBackend, adaptShipmentsFromBackend } from './envio.adapter';
import { SHIPMENTS_FIXTURE } from '../fixtures/envio.fixture';

describe('envio.adapter', () => {
  it('debe normalizar una guía con monto y proveedor', () => {
    expect(adaptShipmentFromBackend(SHIPMENTS_FIXTURE[0])).toEqual({
      id: 'e-1',
      guia: 'BGH-ABC123-DEF456',
      orderId: 'o-1',
      companyId: 'emp-1',
      logisticsMode: 'hibrida',
      providerType: null,
      providerTenantId: null,
      status: 'en_preparacion',
      createdAt: '2026-10-22T15:00:00.000Z',
      amount: 2300,
    });
  });

  it('debe normalizar una guía sin monto y con proveedor', () => {
    expect(adaptShipmentFromBackend(SHIPMENTS_FIXTURE[1])).toMatchObject({
      id: 'e-2',
      providerType: 'plataforma',
      logisticsMode: 'plataforma',
      status: 'enviada',
    });
    expect(adaptShipmentFromBackend(SHIPMENTS_FIXTURE[1])?.amount).toBeUndefined();
  });

  it('debe tolerar camelCase, envelopes y descartar sin id', () => {
    expect(
      adaptShipmentFromBackend({
        id: 'e-3',
        guia: 'G',
        orderId: 'o-3',
        empresaId: 'e',
        modalidadLogistica: 'propia',
        proveedorTipo: 'empresa',
        estado: 'enviada',
      }),
    ).toMatchObject({ id: 'e-3', orderId: 'o-3', companyId: 'e', logisticsMode: 'propia' });

    expect(adaptShipmentsFromBackend({ data: SHIPMENTS_FIXTURE })).toHaveLength(2);
    expect(adaptShipmentsFromBackend([{ id: null }])).toEqual([]);
    expect(adaptShipmentsFromBackend(null)).toEqual([]);
  });
});
