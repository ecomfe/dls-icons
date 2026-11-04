import path from 'node:path'
import { copyFileSync } from 'node:fs'
import { rollup } from 'rollup'
import alias from '@rollup/plugin-alias'
import { babel } from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import autoExternal from 'rollup-plugin-auto-external'
import css from 'rollup-plugin-postcss'
import cssnano from 'cssnano'
import dls from 'less-plugin-dls'

const __dirname = import.meta.dirname

const babelConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false
      }
    ],
    '@babel/preset-react'
  ],
  exclude: 'node_modules/**',
  extensions: ['.js'],
  babelHelpers: 'bundled'
}

const main = async () => {
  const plugins = [
    resolve(),
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, '../../src')
        }
      ]
    }),
    css({
      plugins: [cssnano()],
      use: {
        less: {
          plugins: [dls()]
        }
      }
    }),
    babel(babelConfig),
    autoExternal()
  ]

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
