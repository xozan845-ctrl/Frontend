import { Pipe, PipeTransform } from '@angular/core';
import type { LineTotalValue } from './line-total.types';

/** Total de una línea (`unitPrice × quantity`) redondeado a dos decimales. */
@Pipe({
  name: 'lineTotal',
  standalone: true,
})
export class LineTotalPipe implements PipeTransform {
  transform(line: LineTotalValue | null | undefined): number {
    if (!line) return 0;
    return Math.round(line.unitPrice * line.quantity * 100) / 100;
  }
}
