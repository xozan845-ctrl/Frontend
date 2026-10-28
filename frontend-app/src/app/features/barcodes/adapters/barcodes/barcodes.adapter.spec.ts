import {
  computeBarcodesSummary,
  createBarcodeLabel,
  ean13CheckDigit,
  generateCode128,
  generateEan13,
  isValidBarcodeCode,
  isValidEan13,
  sanitizeBarcodeLabels,
} from './barcodes.adapter';
import type { BarcodeLabel } from '../../models/barcode.model';

const LABEL: BarcodeLabel = {
  id: 'barcode-1',
  productName: 'Camisa',
  sku: 'SKU-1',
  code: generateEan13('123'),
  symbology: 'EAN13',
  copies: 5,
  createdAt: '2026-10-28T12:00:00.000Z',
};

describe('barcodes.adapter', () => {
  it('debe normalizar etiquetas válidas y descartar inválidas', () => {
    const labels = sanitizeBarcodeLabels([
      LABEL,
      { ...LABEL, id: '' },
      { ...LABEL, code: '123' },
      { ...LABEL, copies: 0 },
      { ...LABEL, symbology: 'OTRA' },
      'no-es-etiqueta',
    ]);

    expect(labels).toEqual([LABEL]);
  });

  it('debe tolerar entradas que no son listas y respetar el límite', () => {
    expect(sanitizeBarcodeLabels(null)).toEqual([]);
    expect(sanitizeBarcodeLabels({})).toEqual([]);
    expect(
      sanitizeBarcodeLabels(
        Array.from({ length: 505 }, (_, index) => ({ ...LABEL, id: `b-${index}` })),
      ),
    ).toHaveLength(500);
  });

  it('debe validar y generar códigos EAN-13 y Code 128', () => {
    const ean = generateEan13('987654321');
    const code128 = generateCode128('sku-1');

    expect(ean).toHaveLength(13);
    expect(isValidEan13(ean)).toBe(true);
    expect(ean13CheckDigit(ean.slice(0, 12))).toBe(Number(ean[12]));
    expect(isValidEan13('1234567890123')).toBe(false);
    expect(isValidBarcodeCode(code128, 'CODE128')).toBe(true);
    expect(isValidBarcodeCode('ab', 'CODE128')).toBe(false);
  });

  it('debe crear etiquetas con código dado o generado', () => {
    const now = new Date('2026-10-28T12:00:00.000Z');
    const withCode = createBarcodeLabel(
      {
        productName: '  Camisa  ',
        sku: '  SKU-1  ',
        code: generateEan13('123'),
        symbology: 'EAN13',
        copies: 3,
      },
      now,
    );
    const generated = createBarcodeLabel(
      { productName: 'Pantalón', sku: 'SKU-2', code: '', symbology: 'CODE128', copies: 1 },
      now,
    );

    expect(withCode).toMatchObject({
      productName: 'Camisa',
      sku: 'SKU-1',
      copies: 3,
      createdAt: '2026-10-28T12:00:00.000Z',
    });
    expect(generated?.code).toMatch(/^BC-/);
  });

  it('debe rechazar payloads inválidos', () => {
    expect(
      createBarcodeLabel({
        productName: '',
        sku: '',
        code: '',
        symbology: 'EAN13',
        copies: 0,
      }),
    ).toBeNull();
    expect(
      createBarcodeLabel({
        productName: 'Camisa',
        sku: 'SKU-1',
        code: '123',
        symbology: 'EAN13',
        copies: 1,
      }),
    ).toBeNull();
  });

  it('debe generar un id alternativo sin crypto.randomUUID', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    try {
      expect(
        createBarcodeLabel({
          productName: 'Camisa',
          sku: 'SKU-1',
          code: generateEan13('1'),
          symbology: 'EAN13',
          copies: 1,
        })?.id,
      ).toMatch(/^barcode-/);
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });

  it('debe sumar etiquetas y copias', () => {
    expect(computeBarcodesSummary([LABEL, { ...LABEL, id: 'b-2', copies: 2 }])).toEqual({
      labelsCount: 2,
      totalCopies: 7,
    });
  });
});
