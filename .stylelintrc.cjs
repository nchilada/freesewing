module.exports = {
  extends: ['stylelint-config-recommended'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          // Transformed by postcss-for
          'for',

          // Transformed by tailwind; see https://tailwindcss.com/docs/functions-and-directives#directives
          'apply',
          'layer',
          'tailwind',
        ],
      },
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: [
          // Supplied by tailwind; see https://tailwindcss.com/docs/functions-and-directives#functions
          'screen',
          'theme',
        ],
      },
    ],
  },
}
