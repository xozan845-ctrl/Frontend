import type { Company, CompanySeller, LogisticsMode } from '../../models/company.model';

const LOGISTICS_MODES: readonly LogisticsMode[] = ['plataforma', 'propia', 'hibrida'];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** Desenvuelve envelopes `{ data }` sin perder la respuesta plana (R-AR-4). */
function unwrap(raw: unknown): Record<string, unknown> | null {
  const record = asRecord(raw);
  if (!record) return null;
  return asRecord(record['data']) ?? record;
}

function readString(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function readNumber(record: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function toLogisticsMode(value: string | null): LogisticsMode {
  return LOGISTICS_MODES.includes(value as LogisticsMode) ? (value as LogisticsMode) : 'plataforma';
}

/** Normaliza `EmpresaResponseDto` (snake_case) al modelo de dominio. */
export function adaptCompanyFromBackend(raw: unknown): Company | null {
  const record = unwrap(raw);
  if (!record) return null;

  const id = readString(record, ['id']);
  if (!id) return null;

  return {
    id,
    name: readString(record, ['nombre', 'name']) ?? 'Empresa',
    logisticsMode: toLogisticsMode(
      readString(record, ['modalidad_logistica', 'logisticsMode', 'logistics_mode']),
    ),
    status: readString(record, ['estado', 'status']) ?? 'activa',
    createdBy: readString(record, ['creado_por', 'createdBy', 'created_by']) ?? '',
    createdAt: readString(record, ['creado_en', 'createdAt', 'created_at']) ?? '',
  };
}

/** Normaliza `VendedorEmpresaResponseDto` al modelo de dominio. */
export function adaptCompanySellerFromBackend(raw: unknown): CompanySeller | null {
  const record = unwrap(raw);
  if (!record) return null;

  const id = readString(record, ['id']);
  if (!id) return null;

  return {
    id,
    name: readString(record, ['nombre', 'name']) ?? 'Vendedor',
    email: readString(record, ['correo', 'email']) ?? '',
    role: readString(record, ['rol', 'role']) ?? 'vendedor',
    participationPercentage:
      readNumber(record, [
        'participacion_porcentaje',
        'participationPercentage',
        'participation_percentage',
      ]) ?? 0,
  };
}
