import { defineConfig } from 'vite-plus'

const generatedFiles = [
  'packages/*/dist/**',
  'packages/dls-icons-*/src/icons/**',
  'packages/dls-icons-*/src/index.*'
]

export default defineConfig({
  lint: {
    plugins: ['eslint', 'oxc', 'typescript', 'unicorn', 'vue'],
    categories: { correctness: 'error' },
    env: { browser: true, node: true },
    ignorePatterns: generatedFiles
  },
  fmt: {
    semi: false,
    singleQuote: true,
    ignorePatterns: [
      ...generatedFiles,
      'build/catalog.json',
      'packages/dls-icons-*/README*.md',
      'packages/dls-icons-data/meta.json',
      'pnpm-lock.yaml'
    ],
    overrides: [{ files: ['packages/site/**'], options: { printWidth: 100, trailingComma: 'none' } }]
  }
})
