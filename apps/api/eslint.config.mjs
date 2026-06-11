import nestConfig from '@kitchenledger/eslint-config/nest';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nestConfig,
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
];
