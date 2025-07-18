export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Add your custom rules here, e.g.,
      'no-console': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
    ignores: ['node_modules', '.next'],
  },
];