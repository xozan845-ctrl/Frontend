import type { ReportStateAliases } from '../../models/report.model';
import { adaptReportEntryFromBackend } from './reports.adapter';

const ALIASES: ReportStateAliases = {
  entregada: 'delivered',
  cancelada: 'cancelled',
  devuelta: 'returned',
};

describe('adaptReportEntryFromBackend', () => {
  it('debe traducir estados propios de la API al vocabulario del reporte', () => {
    expect(
      adaptReportEntryFromBackend({ date: '2026-11-19', total: 100, status: 'Entregada' }, ALIASES)
        .status,
    ).toBe('delivered');
  });

  it('debe aceptar estados canónicos sin alias', () => {
    expect(adaptReportEntryFromBackend({ date: '', total: 0, status: 'paid' }, {}).status).toBe(
      'paid',
    );
  });

  it('debe marcar como desconocido un estado no reconocido', () => {
    expect(
      adaptReportEntryFromBackend({ date: '', total: 0, status: 'en revisión' }, ALIASES).status,
    ).toBe('unknown');
  });

  it('no debe tomar propiedades heredadas del mapa de alias como estado', () => {
    expect(
      adaptReportEntryFromBackend({ date: '', total: 0, status: 'constructor' }, {}).status,
    ).toBe('unknown');
    expect(
      adaptReportEntryFromBackend({ date: '', total: 0, status: '__proto__' }, ALIASES).status,
    ).toBe('unknown');
  });

  it('debe caer a desconocido si un alias apunta a un estado inválido', () => {
    const invalidAliases = { raro: 'vendida' } as unknown as ReportStateAliases;

    expect(
      adaptReportEntryFromBackend({ date: '', total: 0, status: 'raro' }, invalidAliases).status,
    ).toBe('unknown');
  });

  it('debe tolerar entradas que no son objetos', () => {
    expect(adaptReportEntryFromBackend([], ALIASES)).toEqual({
      date: '',
      total: 0,
      status: 'unknown',
    });
  });

  it('debe normalizar acentos, mayúsculas y espacios del estado', () => {
    expect(
      adaptReportEntryFromBackend({ date: '', total: 0, status: '  DEVUELTA ' }, ALIASES).status,
    ).toBe('returned');
    expect(
      adaptReportEntryFromBackend({ date: '', total: 0, status: 'en preparación' }, ALIASES).status,
    ).toBe('unknown');
  });

  it('debe sanear montos inválidos y negativos', () => {
    expect(adaptReportEntryFromBackend({ date: '', total: -5, status: 'paid' }, {}).total).toBe(0);
    expect(
      adaptReportEntryFromBackend({ date: '', total: '12,505', status: 'paid' }, {}).total,
    ).toBe(12.51);
    expect(adaptReportEntryFromBackend({ date: '', total: 'x', status: 'paid' }, {}).total).toBe(0);
  });

  it('debe tolerar entradas nulas o sin fecha', () => {
    expect(adaptReportEntryFromBackend(null, ALIASES)).toEqual({
      date: '',
      total: 0,
      status: 'unknown',
    });
    expect(adaptReportEntryFromBackend({ total: 10, status: 'paid' }, {})).toEqual({
      date: '',
      total: 10,
      status: 'paid',
    });
  });
});
