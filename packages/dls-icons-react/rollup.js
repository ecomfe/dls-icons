import path from 'path'
import { rollup } from 'rollup'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import autoExternal from 'rollup-plugin-auto-external'
import css from 'rollup-plugin-postcss'
import cssnano from 'cssnano'

const babelConfig = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-proposal-export-default-from',
    'babel-plugin-react-require',
  ],
  exclude: 'node_modules/**',
  extensions: ['.js'],
  babelHelpers: 'bundled',
}

const main = async () => {
  const plugins = [
    resolve(),
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, '../../src'),
        },
      ],
    }),
    css({ plugins: [cssnano()] }),
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
