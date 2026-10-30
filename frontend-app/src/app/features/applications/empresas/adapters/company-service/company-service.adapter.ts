import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../../../core/models/api-response.dto';
import { COMPANY_SERVICE_MAX_DURATION_MINUTES } from '../../constants/company-services.constants';
import type { CompanyCatalogSort } from '../../models/company-catalog.model';
import type {
  BackendCompanyServiceDTO,
  BackendCompanyServiceListDTO,
} from '../../models/company-service.dto';
import type {
  CompanyService,
  CompanyServiceFilters,
  CompanyServiceStatus,
} from '../../models/company-service.model';

const CODE_PATTERN = /^[A-Za-z0-9-]{2,32}$/;
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function hasId(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
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

/**
 * Normaliza `ServicioResponseDto` al modelo de la aplicación. `null` si el
 * registro no tiene id/código/nombre, precio o duración válidos.
 */
export function adaptCompanyServiceFromBackend(raw: unknown): CompanyService | null {
  if (!isRecord(raw)) return null;
  const service = unwrapApiSingleResponse<BackendCompanyServiceDTO>(raw);
  if (!service || typeof service !== 'object') return null;

  const id = service.id;
  if (!hasId(id)) return null;

  const code = normalizeCompanyServiceCode(toText(service.codigo ?? service.code));
  const name = toText(service.nombre ?? service.name);
  const price = parseCompanyServicePrice(
    toPriceInput(service.precio ?? service.precio_venta ?? service.price ?? null),
  );
  const durationMinutes = parseCompanyServiceDuration(
    service.duracion_minutos ?? service.duracionMinutos ?? service.durationMinutes,
  );
  if (!CODE_PATTERN.test(code) || !name || price === null || durationMinutes === null) return null;

  const createdAt = toIso(service.creado_en ?? service.creadoEn, new Date(0).toISOString());
  return {
    id: String(id),
    companyId: hasId(service.empresa_id ?? service.empresaId)
      ? String(service.empresa_id ?? service.empresaId)
      : '',
    code,
    name,
    description: toText(service.descripcion),
    category: toText(service.categoria),
    brand: toText(service.marca),
    barcode: toText(service.codigo_barras ?? service.codigoBarras),
    price,
    cost: parseCompanyServicePrice(toPriceInput(service.costo)) ?? 0,
    unit: toText(service.unidad, 'Hora (h)'),
    durationMinutes,
    status: toStatus(service.estado),
    createdAt,
    updatedAt: toIso(service.actualizado_en ?? service.actualizadoEn, createdAt),
  };
}

/** Extrae la lista de servicios de arrays o envelopes conocidos. */
function extractServiceList(response: unknown): unknown[] {
  const direct = unwrapApiListResponse<unknown>(response);
  if (direct.length > 0) return direct;
  if (!isRecord(response)) return [];
  const wrapped = unwrapApiSingleResponse<BackendCompanyServiceListDTO>(response);
  if (!wrapped || typeof wrapped !== 'object') return [];
  const list = wrapped.servicios ?? wrapped.items ?? wrapped.data ?? wrapped.results;
  return Array.isArray(list) ? list : [];
}

/** Normaliza el listado completo; descarta registros inválidos y duplicados. */
export function adaptCompanyServicesFromBackend(response: unknown): CompanyService[] {
  const services: CompanyService[] = [];
  for (const item of extractServiceList(response)) {
    const service = adaptCompanyServiceFromBackend(item);
    if (!service) continue;
    if (services.some((current) => current.id === service.id)) continue;
    if (findCompanyServiceByCode(services, service.code)) continue;
    services.push(service);
  }
  return services;
}

/** Filtra por texto (nombre, código, categoría, marca o descripción), categoría, marca y estado. */
export function filterCompanyServices(
  services: readonly CompanyService[],
  filters: CompanyServiceFilters = {},
): CompanyService[] {
  const search = normalizeCompanyServiceSearch(filters.search ?? '');
  const category = normalizeCompanyServiceSearch(filters.category ?? '');
  const brand = normalizeCompanyServiceSearch(filters.brand ?? '');
  const status = filters.status ?? null;

  const filtered = services.filter((service) => {
    if (status && service.status !== status) return false;
    if (category && normalizeCompanyServiceSearch(service.category) !== category) return false;
    if (brand && normalizeCompanyServiceSearch(service.brand) !== brand) return false;
    if (!search) return true;

    const haystack = normalizeCompanyServiceSearch(
      `${service.name} ${service.code} ${service.category} ${service.brand} ${service.barcode} ${service.description}`,
    );
    return haystack.includes(search);
  });

  return sortCompanyServices(filtered, filters.sort ?? 'nombre-az');
}

/** Ordena servicios sin mutar el arreglo original. */
export function sortCompanyServices(
  services: readonly CompanyService[],
  sort: CompanyCatalogSort,
): CompanyService[] {
  const sorted = [...services];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'nombre-az':
        return a.name.localeCompare(b.name, 'es');
      case 'nombre-za':
        return b.name.localeCompare(a.name, 'es');
      case 'precio-asc':
        return a.price - b.price;
      case 'precio-desc':
        return b.price - a.price;
      case 'stock-asc':
        return a.durationMinutes - b.durationMinutes;
      case 'stock-desc':
        return b.durationMinutes - a.durationMinutes;
      case 'reciente':
        return Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt);
    }
  });
  return sorted;
}
