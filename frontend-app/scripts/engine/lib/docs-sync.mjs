/**
 * Evaluación pura del gate de sincronización docs↔código (R-DO-8).
 *
 * Recibe la lista de archivos cambiados por el PR y las compuertas del proyecto;
 * devuelve los hallazgos en los que una compuerta se activó (cambió código) pero
 * no se actualizó ninguna documentación requerida. No toca disco ni git.
 *
 * @typedef {{ id: string, when: RegExp[], exclude?: RegExp[], require: RegExp[], reason: string }} DocsSyncGate
 * @typedef {{ paths: RegExp[], reason: string }} DocsSyncExemption
 */

/**
 * @param {string[]} changedFiles Rutas relativas a la raíz del repo.
 * @param {{ gates?: DocsSyncGate[], exemptions?: DocsSyncExemption[] }} config
 * @returns {Array<{ gate: string, files: string[], reason: string }>}
 */
export function evaluateDocsSync(changedFiles, { gates = [], exemptions = [] } = {}) {
  const findings = [];

  for (const gate of gates) {
    const touched = changedFiles.filter(
      (file) =>
        gate.when.some((pattern) => pattern.test(file)) &&
        !(gate.exclude ?? []).some((pattern) => pattern.test(file)),
    );
    if (touched.length === 0) continue;

    const exempt = exemptions.some((exemption) =>
      touched.some((file) => exemption.paths.some((pattern) => pattern.test(file))),
    );
    if (exempt) continue;

    const documented = changedFiles.some((file) =>
      gate.require.some((pattern) => pattern.test(file)),
    );
    if (!documented) {
      findings.push({ gate: gate.id, files: touched, reason: gate.reason });
    }
  }

  return findings;
}
