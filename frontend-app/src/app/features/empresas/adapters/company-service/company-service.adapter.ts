import {
  COMPANY_SERVICE_MAX_DURATION_MINUTES,
  COMPANY_SERVICE_MAX_RECORDS,
} from '../../constants/company-services.constants';
import type {
  CompanyService,
  CompanyServiceFilters,
  CompanyServiceStatus,
  CreateCompanyServiceData,
  UpdateCompanyServiceData,
} from '../../models/company-service.model';

const CODE_PATTERN = /^[A-Za-z0-9-]{2,32}$/;
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

/** Acepta precios guardados como número o string antes de validarlos. */
function toPriceInput(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' ? value : '';
}

function toIso(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function toStatus(value: unknown): CompanyServiceStatus {
  return value === 'inactivo' ? 'inactivo' : 'activo';
}

/** Normaliza el código para comparaciones y almacenamiento. */
export function normalizeCompanyServiceCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Normaliza texto para búsquedas sin distinguir mayúsculas ni acentos. */
export function normalizeCompanyServiceSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Convierte el precio del formulario a número; `null` si no es válido. */
export function parseCompanyServicePrice(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!PRICE_PATTERN.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100) / 100;
}

/** Valida la duración como entero positivo en minutos. */
export function parseCompanyServiceDuration(value: unknown): number | null {
  const duration = typeof value === 'string' ? Number(value) : value;
  if (typeof duration !== 'number' || !Number.isFinite(duration)) return null;
  const rounded = Math.trunc(duration);
  if (rounded < 1 || rounded > COMPANY_SERVICE_MAX_DURATION_MINUTES) return null;
  return rounded;
}

/** Indica si un código ya existe (ignorando opcionalmente el servicio editado). */
export function findCompanyServiceByCode(
  services: readonly CompanyService[],
  code: string,
  ignoreId?: string,
): CompanyService | null {
  const normalized = normalizeCompanyServiceCode(code);
  return (
    services.find(
      (service) =>
        service.id !== ignoreId && normalizeCompanyServiceCode(service.code) === normalized,
    ) ?? null
  );
}

/** Normaliza un registro leído de `localStorage`; `null` si es inválido. */
export function sanitizeCompanyService(raw: unknown): CompanyService | null {
  if (!isRecord(raw)) return null;

  const id = toText(raw['id']);
  const code = normalizeCompanyServiceCode(toText(raw['code']));
  const name = toText(raw['name']);
  const price = parseCompanyServicePrice(toPriceInput(raw['price']));
  const durationMinutes = parseCompanyServiceDuration(raw['durationMinutes']);
  if (!id || !CODE_PATTERN.test(code) || !name || price === null || durationMinutes === null) {
    return null;
  }

  const createdAt = toIso(raw['createdAt'], new Date(0).toISOString());
  return {
    id,
    companyId: toText(raw['companyId']),
    code,
    name,
    description: toText(raw['description']),
    category: toText(raw['category']),
    price,
    durationMinutes,
    status: toStatus(raw['status']),
    createdAt,
    updatedAt: toIso(raw['updatedAt'], createdAt),
  };
}

/**
 * Sanea la lista completa de servicios: descarta registros inválidos, limita
 * el tamaño y elimina duplicados por id o código.
 */
export function sanitizeCompanyServices(raw: unknown): CompanyService[] {
  if (!Array.isArray(raw)) return [];

  const services: CompanyService[] = [];
  for (const item of raw) {
    const service = sanitizeCompanyService(item);
    if (!service) continue;
    if (services.some((current) => current.id === service.id)) continue;
    if (findCompanyServiceByCode(services, service.code)) continue;
    services.push(service);
    if (services.length >= COMPANY_SERVICE_MAX_RECORDS) break;
  }
  return services;
}

/** Construye el registro a guardar a partir del formulario. */
export function createCompanyServiceRecord(
  data: CreateCompanyServiceData,
  options: { id: string; companyId: string; now: string },
): CompanyService | null {
  const code = normalizeCompanyServiceCode(data.code);
  const name = data.name.trim();
  const price = parseCompanyServicePrice(data.price);
  const durationMinutes = parseCompanyServiceDuration(data.durationMinutes);
  if (!CODE_PATTERN.test(code) || !name || price === null || durationMinutes === null) return null;

  return {
    id: options.id,
    companyId: options.companyId,
    code,
    name,
    description: data.description?.trim() ?? '',
    category: data.category?.trim() ?? '',
    price,
    durationMinutes,
    status: data.status === 'inactivo' ? 'inactivo' : 'activo',
    createdAt: options.now,
    updatedAt: options.now,
  };
}

/** Aplica los cambios editables del formulario a un servicio existente. */
export function updateCompanyServiceRecord(
  current: CompanyService,
  data: UpdateCompanyServiceData,
  now: string,
): CompanyService | null {
  const price = data.price === undefined ? current.price : parseCompanyServicePrice(data.price);
  const durationMinutes =
    data.durationMinutes === undefined
      ? current.durationMinutes
      : parseCompanyServiceDuration(data.durationMinutes);
  if (price === null || durationMinutes === null) return null;

  const name = data.name === undefined ? current.name : data.name.trim();
  if (!name) return null;

  return {
    ...current,
    name,
    description: data.description === undefined ? current.description : data.description.trim(),
    category: data.category === undefined ? current.category : data.category.trim(),
    price,
    durationMinutes,
    status: data.status ?? current.status,
    updatedAt: now,
  };
}

/** Filtra por texto (nombre, código, categoría o descripción), categoría y estado. */
export function filterCompanyServices(
  services: readonly CompanyService[],
  filters: CompanyServiceFilters = {},
): CompanyService[] {
  const search = normalizeCompanyServiceSearch(filters.search ?? '');
  const category = normalizeCompanyServiceSearch(filters.category ?? '');
  const status = filters.status ?? null;

  return services.filter((service) => {
    if (status && service.status !== status) return false;
    if (category && normalizeCompanyServiceSearch(service.category) !== category) return false;
    if (!search) return true;

    const haystack = normalizeCompanyServiceSearch(
      `${service.name} ${service.code} ${service.category} ${service.description}`,
    );
    return haystack.includes(search);
  });
}
