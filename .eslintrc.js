module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
  ],
  rules: {
    'prefer-const': ['error', {destructuring: 'all'}],
    'comma-dangle': ['error', 'always-multiline'],
    'space-infix-ops': 'error',
    'no-multi-spaces': 'error',
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/member-delimiter-style': ['error', {"multiline": {
        "delimiter": "none",
          "requireLast": true
      },
      "singleline": {
        "delimiter": "comma",
          "requireLast": false
      }
    }
    ],
    '@typescript-eslint/quotes': ['error', 'single', {avoidEscape: true}],
    'jsx-quotes': ['error', 'prefer-double'],
    'react/jsx-curly-brace-presence': ['error', {props: 'never'}],
    'react/no-find-dom-node': 'off',
    'react/no-children-prop': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
  }
}
