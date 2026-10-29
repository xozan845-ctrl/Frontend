import { defineSuite } from '../../engine/suite.mjs';
import { classify, findLayerViolations } from './checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * Dirección de dependencias entre capas.
 *
 * R-AR-2  core/shared/layout no importan features.
 * R-AR-8  HttpClient sólo en services/ (o interceptors).
 * R-CX-1  una capa sólo depende de las interiores.
 * R-CX-4  models/ es dominio puro (sin Angular/rxjs).
 * R-CX-6  otro feature sólo por public-api/public-ui.
 * R-SO-8  presentacionales (components/) no dependen de stores/servicios.
 * R-ST-1  stores orquestan estado a partir de puertos/servicios.
 */
export default defineSuite({
  id: 'architecture-layers',
  area: 'architecture',
  rules: ['R-AR-2', 'R-AR-8', 'R-CX-1', 'R-CX-4', 'R-CX-6', 'R-SO-8', 'R-ST-1'],
  cites: ['R-AR-3'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('los módulos anidados se clasifican como features propias', () => {
      assert.deepEqual(
        classify('src/app/features/modules/sales/pages/orders/orders.component.ts'),
        {
          kind: 'feature',
          feature: 'modules/sales',
          layer: 'pages',
        },
      );
    });

    test('los grupos físicos conservan la identidad lógica del feature', () => {
      assert.deepEqual(
        classify('src/app/features/applications/auth/pages/login-form/login-form.component.ts'),
        {
          kind: 'feature',
          feature: 'auth',
          layer: 'pages',
        },
      );
      assert.deepEqual(classify('src/app/features/domains/clients/models/client.model.ts'), {
        kind: 'feature',
        feature: 'clients',
        layer: 'models',
      });
    });

    test('La dependencia va hacia dentro: pages/components → state → services → repositories/adapters → models', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-layers',
        findings: findLayerViolations(),
        message:
          'Hay importaciones que rompen la dirección de dependencias. ' +
          'pages/components consumen estado (stores); los stores orquestan servicios/puertos; ' +
          'los services usan adapters/repositorios; models no depende de nadie (R-CX-1):',
      });
    });

    test('R-CX-6: no hay imports internos entre features', () => {
      const crossFeature = findLayerViolations().filter((finding) => finding.rule === 'R-CX-6');

      assert.deepEqual(
        crossFeature,
        [],
        'Cada dependencia entre features debe pasar por public-api.ts o public-ui.ts (R-CX-6).',
      );
    });
  },
});
