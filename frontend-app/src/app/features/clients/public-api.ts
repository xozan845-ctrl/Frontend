/**
 * API pública del módulo compartido de clientes. Empresa y vendedor consumen
 * el mismo modelo, adaptador, store y página con su propia fuente de datos.
 */
export {
  CLIENTS_DATA_SOURCE,
  type ClientsDataSource,
} from './repositories/clients-data-source.repository';
export {
  CLIENTS_PAGE_CONFIG,
  CLIENTS_SCOPE_CONFIG,
} from '../../shared/clients/constants/clients-config.tokens';
export type {
  ClientsPageConfig,
  ClientsScopeConfig,
} from '../../shared/clients/models/clients-config.model';
export {
  CLIENT_ACTIVE_DAYS,
  CLIENT_FREQUENT_ORDERS,
  CLIENT_IMPORT_MAX_BYTES,
  CLIENT_PAGE_SIZE,
  clientsStorageKey,
} from './constants/clients.constants';
export {
  adaptClientOrdersFromBackend,
  buildClients,
  clientFallbackName,
  computeClientKpis,
  createClientRecord,
  filterClientsByChip,
  filterClientsByTab,
  findDuplicateClient,
  normalizeClientSearch,
  parseClientsCsv,
  sanitizeClientRecords,
  searchClients,
} from './adapters/clients/client.adapter';
export type {
  Client,
  ClientChip,
  ClientCsvParseResult,
  ClientImportResult,
  ClientImportRow,
  ClientKpis,
  ClientMutationResult,
  ClientOrder,
  ClientRecord,
  ClientSource,
  ClientsTab,
  ClientStatus,
  CreateClientPayload,
} from './models/client.model';
export { ClientsStore } from './state/clients/clients.store';
export { ClientsHttpDataSource } from './services/clients-data/clients-data.service';
