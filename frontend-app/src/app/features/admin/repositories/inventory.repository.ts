import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryLine } from '../models/inventory.model';

/** Puerto de inventario de bodega (`GET /admin/inventario`, solo admin). */
export interface InventoryRepository {
  list(): Observable<InventoryLine[]>;
}

export const INVENTORY_REPOSITORY = new InjectionToken<InventoryRepository>('InventoryRepository');
