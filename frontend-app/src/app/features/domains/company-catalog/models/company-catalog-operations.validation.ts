import type {
  CompanyComboFormValue,
  CompanyInventoryMovementFormValue,
  CompanyPromotionFormValue,
} from './company-catalog-operations.model';

const CODE_PATTERN = /^[A-Za-z0-9-]{2,32}$/;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function parseMoney(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!MONEY_PATTERN.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

export function validDate(value: string): boolean {
  return !!value && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

export function validateCombo(form: CompanyComboFormValue): string | null {
  if (!CODE_PATTERN.test(form.sku.trim())) {
    return 'Usa un SKU de 2 a 32 letras, números o guiones.';
  }
  if (form.name.trim().length < 2) return 'Escribe el nombre del combo.';
  if (parseMoney(form.price) === null) return 'Revisa el precio del combo.';
  const components = form.components.filter((component) => component.sku.trim());
  if (components.length === 0) return 'Agrega al menos un producto al combo.';
  if (components.some((component) => component.quantity < 1)) {
    return 'Cada componente debe tener una cantidad mayor que cero.';
  }
  return null;
}

export function validatePromotion(form: CompanyPromotionFormValue): string | null {
  if (form.name.trim().length < 2) return 'Escribe el nombre de la promoción.';
  if (!validDate(form.from) || !validDate(form.to)) return 'Revisa las fechas de vigencia.';
  if (Date.parse(form.to) < Date.parse(form.from)) {
    return 'La fecha final no puede ser anterior a la inicial.';
  }
  if (form.type === 'descuento_porcentaje') {
    if (
      form.discountPercentage === null ||
      form.discountPercentage < 1 ||
      form.discountPercentage > 100
    ) {
      return 'El descuento debe estar entre 1 y 100 %.';
    }
  }
  if (form.type === 'descuento_cantidad' || form.type === 'regalo') {
    if (!form.requiredQuantity || form.requiredQuantity < 1) {
      return 'Indica la cantidad requerida.';
    }
    if (!form.freeQuantity || form.freeQuantity < 1) return 'Indica la cantidad gratis.';
  }
  return null;
}

export function validateMovement(form: CompanyInventoryMovementFormValue): string | null {
  const lines = form.lines.filter((line) => line.sku.trim());
  if (lines.length === 0) return 'Agrega al menos una línea al movimiento.';
  if (lines.some((line) => line.quantity < 1)) {
    return 'Cada línea debe tener una cantidad mayor que cero.';
  }
  if (form.type === 'traslado' && (!form.origin.trim() || !form.destination.trim())) {
    return 'Indica la ubicación de origen y destino para el traslado.';
  }
  return null;
}
