/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-order'],
  rules: {
    // ── Enforce SCSS Modules naming ────────────────────────────────────────
    // All style files must be *.module.scss (enforced by file pattern in CI)

    // ── Variables must come from abstracts/ ───────────────────────────────
    'scss/no-global-function-names': true,
    'scss/at-import-no-partial-leading-underscore': true,

    // ── No plain colors — must use variables ─────────────────────────────
    'color-named': 'never',
    'color-no-invalid-hex': true,

    // ── No hardcoded units — prefer variables ─────────────────────────────
    'unit-disallowed-list': [],

    // ── Empty sources ─────────────────────────────────────────────────────
    'no-empty-source': true,

    // ── Selector rules ────────────────────────────────────────────────────
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      {
        message: 'Class selectors must use camelCase (matches CSS Modules convention)',
      },
    ],
    'selector-max-id': 0,
    'selector-no-qualifying-type': true,

    // ── Declaration ordering ──────────────────────────────────────────────
    'order/order': ['custom-properties', 'dollar-variables', 'at-rules', 'declarations', 'rules'],
    'order/properties-order': [
      // Positioning
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      // Box model
      'display',
      'flex',
      'flex-direction',
      'flex-wrap',
      'align-items',
      'justify-content',
      'gap',
      'grid',
      'grid-template',
      'width',
      'min-width',
      'max-width',
      'height',
      'min-height',
      'max-height',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      // Visual
      'background',
      'background-color',
      'background-image',
      'border',
      'border-radius',
      'box-shadow',
      'outline',
      // Typography
      'font',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'color',
      'text-align',
      'text-decoration',
      // Misc
      'opacity',
      'cursor',
      'transition',
      'transform',
      'animation',
      'overflow',
      'visibility',
    ],

    // ── SCSS-specific ─────────────────────────────────────────────────────
    'scss/double-slash-comment-whitespace-inside': 'always',
    'scss/operator-no-unspaced': true,
    'scss/no-duplicate-dollar-variables': true,

    // ── Formatting ────────────────────────────────────────────────────────
    'max-nesting-depth': [
      3,
      {
        message: 'Max nesting depth is 3. Refactor deep selectors.',
      },
    ],
    'declaration-no-important': true,
    'shorthand-property-no-redundant-values': true,

    // ── Disable rules that conflict with SCSS ─────────────────────────────
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
  },
  ignoreFiles: ['node_modules/**', 'dist/**', '.next/**', 'coverage/**'],
};
