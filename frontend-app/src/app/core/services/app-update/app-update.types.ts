import type { AppVersionInfo } from '../app-version/app-version.types';

/** Versión nueva detectada por el service worker. */
export interface AppUpdateInfo extends AppVersionInfo {
  hash: string;
}
