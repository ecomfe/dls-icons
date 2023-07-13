import { copyFileSync } from 'fs'
import { rollup } from 'rollup'
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'

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
    input: 'src/index.js',
    plugins
  }

  const bundle = await rollup(inputOptions)
  bundle.write({
    format: 'cjs',
    file: 'dist/cjs/index.js',
    sourcemap: true
  })
  bundle.write({
    format: 'es',
    file: 'dist/es/index.js',
    sourcemap: true
  })

  copyFileSync('src/index.d.ts', 'dist/index.d.ts')
}

main()
