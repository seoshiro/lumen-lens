import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,mjs}'], languageOptions: { globals: { window:'readonly', document:'readonly', navigator:'readonly', localStorage:'readonly', location:'readonly', history:'readonly', requestAnimationFrame:'readonly', cancelAnimationFrame:'readonly', performance:'readonly', Image:'readonly', NodeFilter:'readonly', HTMLCanvasElement:'readonly', ResizeObserver:'readonly', IntersectionObserver:'readonly', URL:'readonly', console:'readonly', setTimeout:'readonly', clearTimeout:'readonly', process:'readonly', Buffer:'readonly' } } },
  { languageOptions: { globals: { getComputedStyle:'readonly' } } },
);
