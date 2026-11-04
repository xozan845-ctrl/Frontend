export default {
  plugins: ['./stylelint-glass-plugin.mjs'],
  rules: {
    'glass/no-raw-glass': true,
  },
  ignoreFiles: ['dist/**', 'node_modules/**', '.angular/**', 'coverage/**', 'playwright-report/**'],
};
