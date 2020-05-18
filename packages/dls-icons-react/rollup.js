import { rollup } from 'rollup'
import babel from 'rollup-plugin-babel'
import svgToReact from 'rollup-plugin-svg-to-jsx'
import autoExternal from 'rollup-plugin-auto-external'
import resolve from 'rollup-plugin-node-resolve'
import css from 'rollup-plugin-postcss'

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
  extensions: ['.js', '.svg'],
}

const main = async () => {
  const plugins = [
    resolve(),
    css(),
    svgToReact({
      include: '../../svg/*.svg'
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
    file: 'cjs/index.js',
    sourcemap: true,
    banner: '/* eslint-disable */',
  })
  bundle.write({
    format: 'es',
    file: 'es/index.js',
    sourcemap: true,
    banner: '/* eslint-disable */',
  })
}

main()
