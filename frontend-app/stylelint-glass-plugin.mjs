/**
 * Plugin de Stylelint para el sistema visual Glass (R-UX-7).
 *
 * Bloquea en editor/CI cualquier reimplementación de cristal fuera de
 * `src/styles.css`: tokens `--glass-*`, `backdrop-filter` crudo, utilidades
 * `.glass*`, primitivos `.card`/`.btn`/`.input`/`.badge`/`.icon-btn` y
 * `@apply` con `backdrop-blur`.
 */
import stylelint from 'stylelint';

const ruleName = 'glass/no-raw-glass';

const messages = stylelint.utils.ruleMessages(ruleName, {
  token: (prop) => `No definas ${prop} fuera de src/styles.css (R-UX-7).`,
  backdrop: (value) => `Usa tokens --glass-* para backdrop-filter; valor crudo: ${value} (R-UX-7).`,
  utility: (selector) => `No redefinas ${selector} fuera de src/styles.css (R-UX-7).`,
  apply: (params) => `No reimplementes cristal con @apply: ${params} (R-UX-7).`,
});

const isStylesFile = (file) => /(^|\/)src\/styles\.css$/.test(file.replace(/\\/g, '/'));

const isGlassUtility = (selector) => /\.glass(?:-[a-z0-9-]+)?(?=$|[:.\s>+~,])/.test(selector);

const isGlassPrimitive = (selector) =>
  /\.(?:card|btn|input|badge|icon-btn|alert)(?:-[a-z0-9-]+)?(?=$|[:.\s>+~,])/.test(selector);

const rule = (enabled) => (root, result) => {
  const validOptions = stylelint.utils.validateOptions(result, ruleName, {
    actual: enabled,
    possible: [true],
  });
  if (!validOptions || !enabled) return;

  const file = root.source?.input?.file ?? '';
  if (isStylesFile(file)) return;

  const report = (message, node) => stylelint.utils.report({ message, node, result, ruleName });

  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--glass-')) {
      report(messages.token(decl.prop), decl);
    }

    if (decl.prop === 'backdrop-filter' || decl.prop === '-webkit-backdrop-filter') {
      if (!decl.value.includes('var(--glass-')) {
        report(messages.backdrop(decl.value), decl);
      }
    }
  });

  root.walkRules((ruleNode) => {
    for (const selector of ruleNode.selectors ?? []) {
      if (isGlassUtility(selector) || isGlassPrimitive(selector)) {
        report(messages.utility(selector), ruleNode);
      }
    }
  });

  root.walkAtRules('apply', (atRule) => {
    if (/backdrop-blur/.test(atRule.params)) {
      report(messages.apply(atRule.params), atRule);
    }
  });
};

export default stylelint.createPlugin(ruleName, rule);
