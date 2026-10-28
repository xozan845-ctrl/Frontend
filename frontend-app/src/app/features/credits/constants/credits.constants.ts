export const CREDITS_MAX_RECORDS = 500;

/** Clave de localStorage aislada por ámbito y tenant/tienda (`R-NC-11`). */
export function creditsStorageKey(scope: 'company' | 'store', scopeId?: string | null): string {
  const suffix =
    (scopeId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_${scope}_credits_${suffix}`;
}
