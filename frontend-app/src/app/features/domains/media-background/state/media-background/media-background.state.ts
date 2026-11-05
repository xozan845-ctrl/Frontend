import { MediaBackgroundConfig } from '../../../../../core/models/media-background.model';

/** Estado del store de fondos multimedia (una ranura por ámbito). */
export interface MediaBackgroundState {
  platform: MediaBackgroundConfig | null;
  panelAi: MediaBackgroundConfig | null;
  company: MediaBackgroundConfig | null;
  store: MediaBackgroundConfig | null;
  platformLoaded: boolean;
  panelAiLoaded: boolean;
  companyLoadedId: string | null;
  storeLoadedId: string | null;
  loadingPlatform: boolean;
  loadingPanelAi: boolean;
  loadingCompany: boolean;
  loadingStore: boolean;
  error: string | null;
}
