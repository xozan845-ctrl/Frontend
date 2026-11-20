import {
  REPORT_ENTRY_STATES,
  type ReportEntry,
  type ReportEntryState,
  type ReportStateAliases,
} from '../../models/report.model';

const CANONICAL_STATES: ReadonlySet<string> = new Set(REPORT_ENTRY_STATES);

/** Clave tolerante: minúsculas, sin acentos y con `_` en lugar de espacios. */
function normalizeKey(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/** Monto no negativo con 2 decimales; valores inválidos caen a 0. */
function toAmount(value: unknown): number {
  const amount = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100) / 100;
}

function toState(value: unknown, aliases: ReportStateAliases): ReportEntryState {
  const key = normalizeKey(value);
  if (CANONICAL_STATES.has(key)) return key as ReportEntryState;
  if (!Object.prototype.hasOwnProperty.call(aliases, key)) return 'unknown';

  const alias = aliases[key];
  return CANONICAL_STATES.has(alias) ? alias : 'unknown';
}

/**
 * Normaliza una entrada externa al modelo del reporte (`R-AR-4`). La traducción
 * de los estados propios de cada API llega en `aliases`; un estado no reconocido
 * queda como `unknown` y nunca se confunde con una venta válida.
 */
export function adaptReportEntryFromBackend(
  raw: unknown,
  aliases: ReportStateAliases,
): ReportEntry {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as { date?: unknown; total?: unknown; status?: unknown })
      : {};

  return {
    date: typeof source.date === 'string' ? source.date : '',
    total: toAmount(source.total),
    status: toState(source.status, aliases),
  };
}
