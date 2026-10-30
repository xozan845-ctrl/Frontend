import type {
  Company,
  CompanySeller,
  CompanyType,
  LogisticsMode,
} from '../../models/company.model';

const LOGISTICS_MODES: readonly LogisticsMode[] = ['plataforma', 'propia', 'hibrida'];
const COMPANY_TYPES: readonly CompanyType[] = ['comercial', 'logistica', 'plataforma'];

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

/** Lee un campo que puede venir como `null` explícito (p. ej. `logo_url`). */
function readNullableString(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | null | undefined {
  for (const key of keys) {
    if (!(key in record)) continue;
    const value = record[key];
    if (value === null || value === '') return null;
    if (typeof value === 'string') return value;
  }
  return undefined;
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

function readStringArray(record: Record<string, unknown>, keys: readonly string[]): string[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
  }
  return [];
}

function toLogisticsMode(value: string | null): LogisticsMode {
  return LOGISTICS_MODES.includes(value as LogisticsMode) ? (value as LogisticsMode) : 'plataforma';
}

function toCompanyType(value: string | null): CompanyType {
  return COMPANY_TYPES.includes(value as CompanyType) ? (value as CompanyType) : 'comercial';
}

/** Asigna un metadato solo cuando el backend lo devuelve con contenido. */
function assignText<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: string | null,
): void {
  if (value) target[key] = value as T[K];
}

/** Normaliza `EmpresaResponseDto` (snake_case) al modelo de dominio. */
export function adaptCompanyFromBackend(raw: unknown): Company | null {
  const record = unwrap(raw);
  if (!record) return null;

  const id = readString(record, ['id']);
  if (!id) return null;

  const company: Company = {
    id,
    name: readString(record, ['nombre', 'name']) ?? 'Empresa',
    logisticsMode: toLogisticsMode(
      readString(record, ['modalidad_logistica', 'logisticsMode', 'logistics_mode']),
    ),
    type: toCompanyType(readString(record, ['tipo_empresa', 'type', 'company_type'])),
    status: readString(record, ['estado', 'status']) ?? 'activa',
    createdBy: readString(record, ['creado_por', 'createdBy', 'created_by']) ?? '',
    createdAt: readString(record, ['creado_en', 'createdAt', 'created_at']) ?? '',
    ...(readString(record, ['slug', 'identificador'])
      ? { slug: readString(record, ['slug', 'identificador'])! }
      : {}),
  };

  assignText(company, 'taxId', readString(record, ['ruc']));
  assignText(company, 'legalName', readString(record, ['razon_social', 'legalName', 'legal_name']));
  assignText(
    company,
    'commercialName',
    readString(record, ['nombre_comercial', 'commercialName', 'commercial_name']),
  );
  assignText(company, 'description', readString(record, ['descripcion', 'description']));
  assignText(company, 'phone', readString(record, ['telefono', 'phone']));
  assignText(
    company,
    'contactEmail',
    readString(record, ['correo_contacto', 'contactEmail', 'contact_email']),
  );
  assignText(company, 'website', readString(record, ['sitio_web', 'website']));
  assignText(company, 'address', readString(record, ['direccion', 'address']));
  assignText(company, 'city', readString(record, ['ciudad', 'city']));
  assignText(company, 'department', readString(record, ['departamento', 'department']));
  assignText(company, 'country', readString(record, ['pais', 'country']));
  assignText(company, 'currency', readString(record, ['moneda', 'currency']));
  assignText(company, 'timezone', readString(record, ['zona_horaria', 'timezone', 'time_zone']));
  assignText(company, 'sector', readString(record, ['sector']));
  assignText(
    company,
    'legalRepresentative',
    readString(record, ['representante_legal', 'legalRepresentative', 'legal_representative']),
  );
  assignText(
    company,
    'businessHours',
    readString(record, ['horario_atencion', 'businessHours', 'business_hours']),
  );
  assignText(
    company,
    'updatedAt',
    readString(record, ['actualizado_en', 'updatedAt', 'updated_at']),
  );

  const logoObjectId = readNullableString(record, ['logo_objeto_id', 'logoObjectId']);
  if (logoObjectId !== undefined) company.logoObjectId = logoObjectId;

  const logoUrl = readNullableString(record, ['logo_url', 'logoUrl']);
  if (logoUrl !== undefined) company.logoUrl = logoUrl;

  return company;
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
    ...(readString(record, ['tienda_id', 'storeId', 'store_id'])
      ? { storeId: readString(record, ['tienda_id', 'storeId', 'store_id'])! }
      : {}),
    ...(readString(record, ['tienda_nombre', 'storeName', 'store_name'])
      ? { storeName: readString(record, ['tienda_nombre', 'storeName', 'store_name'])! }
      : {}),
    ...(readStringArray(record, ['permisos', 'permissions']).length
      ? { permissions: readStringArray(record, ['permisos', 'permissions']) }
      : {}),
    ...(record['logistics_ownership'] === 'company' ||
    record['logistics_ownership'] === 'store' ||
    record['logistics_ownership'] === 'logistics_company'
      ? { logisticsOwnership: record['logistics_ownership'] }
      : {}),
  };
}
