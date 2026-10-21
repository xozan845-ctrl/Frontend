import { defineSuite } from '../../engine/suite.mjs';
import { findSecurityViolations } from './checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-SE-3/4/7/9 — guardas estáticas de seguridad.
 */
export default defineSuite({
  id: 'security-guards',
  area: 'security',
  rules: ['R-SE-3', 'R-SE-4', 'R-SE-7', 'R-SE-9'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-SE-3/4/7/9: sin innerHTML, console.log, enlaces inseguros ni CSP ausente', () => {
      assertNoFresh({
        assert,
        suiteId: 'security-guards',
        findings: findSecurityViolations(),
        message:
          'Hay hallazgos de seguridad estática (R-SE-3/4/7/9). ' +
          'Revisa innerHTML/bypassSecurityTrust, console.log, enlaces target="_blank" y la CSP:',
      });
    });
  },
});
