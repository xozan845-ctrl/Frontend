/** API de aplicación pública de `stores` para dominios consumidores. */
export { StoreWizardStore } from './state/store-wizard/store-wizard.store';
export type {
  CatalogProductOption,
  OfferDraft,
  StoreDraft,
  WizardStep,
} from './models/store-wizard.model';
export { STORE_REPOSITORY, type StoreRepository } from './repositories/store.repository';
export { StoreService } from './services/store/store.service';
