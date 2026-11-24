import type { ReportEntry } from '../../models/report.model';

/**
 * Resultado puro de una lectura de reportes: entradas normalizadas y el
 * instante en que la fuente confirmó la lectura. Sin señales de Angular para
 * que el puerto pueda probarse y reutilizarse fuera de la capa de presentación
 * (R-AR-3).
 */
export interface ReportsReadResult {
  readonly entries: readonly ReportEntry[];
  readonly loadedAt: Date;
}

/** Operación asíncrona de lectura de reportes del workspace. */
export interface ReportsSourcePort {
  read(): Promise<ReportsReadResult>;
}
