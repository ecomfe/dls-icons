import path from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync } from 'fs'
import { rollup } from 'rollup'
import { babel } from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const babelConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false
      }
    ]
  ],
  plugins: ['@babel/plugin-proposal-export-default-from'],
  exclude: 'node_modules/**',
  extensions: ['.js'],
  babelHelpers: 'bundled'
}

const main = async () => {
  const plugins = [resolve(), babel(babelConfig)]

  const inputOptions = {
    context: __dirname,
    input: path.resolve(__dirname, 'src/index.js'),
    plugins
  }

  const bundle = await rollup(inputOptions)
  await Promise.all([
    bundle.write({
      format: 'cjs',
      file: path.resolve(__dirname, 'dist/cjs/index.js'),
      sourcemap: true
    }),
    bundle.write({
      format: 'es',
      file: path.resolve(__dirname, 'dist/es/index.js'),
      sourcemap: true
    })
  ])
  copyFileSync(
    path.resolve(__dirname, 'src/index.d.ts'),
    path.resolve(__dirname, 'dist/index.d.ts')
  )
}

main()
