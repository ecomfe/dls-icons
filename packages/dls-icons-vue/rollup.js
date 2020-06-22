import { rollup } from 'rollup'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import babel from 'rollup-plugin-babel'
import { string } from 'rollup-plugin-string'
import autoExternal from 'rollup-plugin-auto-external'
import resolve from 'rollup-plugin-node-resolve'
import css from 'rollup-plugin-postcss'
import path from 'path'

const babelConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
      },
    ]
  ],
  plugins: [
    '@babel/plugin-proposal-export-default-from'
  ],
  exclude: 'node_modules/**',
  extensions: ['.js'],
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
    json(),
    css(),
    string({
      include: '../../svg/*.svg',
    }),
    babel(babelConfig),
    autoExternal({ dependencies: false }),
  ]

  const inputOptions = {
    context: __dirname,
    input: 'src/index.js',
    plugins: plugins,
  }

  const bundle = await rollup(inputOptions)
  bundle.write({
    format: 'cjs',
    file: 'dist/cjs/index.js',
    sourcemap: true,
    banner: '/* eslint-disable */',
  })
  bundle.write({
    format: 'es',
    file: 'dist/es/index.js',
    sourcemap: true,
    banner: '/* eslint-disable */',
  })
}

main()
