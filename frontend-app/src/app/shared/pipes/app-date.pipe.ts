import { Pipe, PipeTransform } from '@angular/core';
import type { AppDateFormat } from './app-date.types';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fechas de presentación en español. Las fechas sin hora se interpretan al
 * mediodía para evitar saltos de día por zona horaria; las inválidas se
 * muestran vacías.
 */
@Pipe({
  name: 'appDate',
  standalone: true,
})
export class AppDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: AppDateFormat = 'long'): string {
    if (!value) return '';
    const date =
      typeof value === 'string' && DATE_ONLY.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    if (format === 'datetime') {
      return new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
    if (format === 'short') {
      return new Intl.DateTimeFormat('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    return new Intl.DateTimeFormat('es-NI', { dateStyle: 'long' }).format(date);
  }
}
