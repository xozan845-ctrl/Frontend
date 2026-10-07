import { unwrapApiListResponse, unwrapApiSingleResponse } from './api-response.dto';

describe('api-response.dto', () => {
  describe('unwrapApiListResponse', () => {
    it('debe devolver un arreglo vacío cuando la respuesta es nula o no es objeto', () => {
      expect(unwrapApiListResponse(null)).toEqual([]);
      expect(unwrapApiListResponse(undefined)).toEqual([]);
      expect(unwrapApiListResponse('texto')).toEqual([]);
      expect(unwrapApiListResponse(42)).toEqual([]);
    });

    it('debe devolver el mismo arreglo cuando la respuesta ya es una lista', () => {
      expect(unwrapApiListResponse([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('debe extraer la lista de las claves data, items, results y products', () => {
      expect(unwrapApiListResponse({ data: [1] })).toEqual([1]);
      expect(unwrapApiListResponse({ items: [2] })).toEqual([2]);
      expect(unwrapApiListResponse({ results: [3] })).toEqual([3]);
      expect(unwrapApiListResponse({ products: [4] })).toEqual([4]);
    });

    it('debe devolver un arreglo vacío cuando no hay ninguna lista reconocible', () => {
      expect(unwrapApiListResponse({ total: 10 })).toEqual([]);
      expect(unwrapApiListResponse({ data: 'no es lista' })).toEqual([]);
    });
  });

  describe('unwrapApiSingleResponse', () => {
    it('debe devolver null cuando la respuesta no es un objeto', () => {
      expect(unwrapApiSingleResponse(null)).toBeNull();
      expect(unwrapApiSingleResponse(undefined)).toBeNull();
      expect(unwrapApiSingleResponse('texto')).toBeNull();
    });

    it('debe desenvolver el objeto de las claves data, item y result', () => {
      expect(unwrapApiSingleResponse({ data: { id: 1 } })).toEqual({ id: 1 });
      expect(unwrapApiSingleResponse({ item: { id: 2 } })).toEqual({ id: 2 });
      expect(unwrapApiSingleResponse({ result: { id: 3 } })).toEqual({ id: 3 });
    });

    it('debe devolver la respuesta original cuando no viene envuelta', () => {
      expect(unwrapApiSingleResponse({ id: 9 })).toEqual({ id: 9 });
    });

    it('debe ignorar envoltorios que sean arreglos', () => {
      expect(unwrapApiSingleResponse({ data: [1, 2] })).toEqual({ data: [1, 2] });
    });
  });
});
