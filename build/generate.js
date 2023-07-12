import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import fetch from 'node-fetch'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import { parse, stringify } from 'svgson'
import stringifyObject from 'stringify-object'
import { camelCase, upperFirst } from 'lodash'
import commentMark from 'comment-mark'
import { optimize } from 'svgo'

function getSVGOConfig ({ id }) {
  return {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            inlineStyles: false,
            convertStyleToAttrs: false,
            minifyStyles: false,
            removeDimensions: false,
            cleanupIDs: {
              prefix: `dls-${id}-`
            },
            cleanupNumericValues: {
              floatPrecision: 3
            }
          }
        }
      },
      {
        name: 'sortAttrs'
      }
    ]
  }
}

const ENDPOINT = process.env.DLS_ICONS_API
const RAW_DIR = path.resolve(__dirname, '../raw')
const SVG_DIR = path.resolve(__dirname, '../svg')
const ICON_PATTERN = /^(.+)\.svg$/

const DATA_TPL = fs.readFileSync(
  path.resolve(__dirname, 'data/data.tpl'),
  'utf8'
)
const DATA_EXPORT_TPL = fs.readFileSync(
  path.resolve(__dirname, 'data/export.tpl'),
  'utf8'
)
const ICON_TPL = fs.readFileSync(
  path.resolve(__dirname, 'icon/icon.tpl'),
  'utf8'
)
const ICON_EXPORT_TPL = fs.readFileSync(
  path.resolve(__dirname, 'icon/export.tpl'),
  'utf8'
)

const TYPINGS_DATA_INDEX_TPL = fs.readFileSync(
  path.resolve(__dirname, 'typings/data.index.tpl'),
  'utf8'
)
const TYPINGS_DATA_TPL = fs.readFileSync(
  path.resolve(__dirname, 'typings/data.tpl'),
  'utf8'
)
const TYPINGS_REACT_INDEX_TPL = fs.readFileSync(
  path.resolve(__dirname, 'typings/react.index.tpl'),
  'utf8'
)
const TYPINGS_REACT_TPL = fs.readFileSync(
  path.resolve(__dirname, 'typings/react.tpl'),
  'utf8'
)
const TYPINGS_VUE_INDEX_TPL = fs.readFileSync(
  path.resolve(__dirname, 'typings/vue.index.tpl'),
  'utf8'
)
const TYPINGS_VUE_TPL = fs.readFileSync(
  path.resolve(__dirname, 'typings/vue.tpl'),
  'utf8'
)

const ICON_PACKS = ['dls-icons-react', 'dls-icons-vue', 'dls-icons-vue-3']
const DATA_PACK = 'dls-icons-data'

const TYPINGS_TPL_MAP = {
  'dls-icons-data': [TYPINGS_DATA_INDEX_TPL, TYPINGS_DATA_TPL],
  'dls-icons-react': [TYPINGS_REACT_INDEX_TPL, TYPINGS_REACT_TPL],
  'dls-icons-vue': [TYPINGS_VUE_INDEX_TPL, TYPINGS_VUE_TPL],
  'dls-icons-vue-3': [TYPINGS_VUE_INDEX_TPL, TYPINGS_VUE_TPL]
}

function getPackDir (name, ...rest) {
  return path.resolve(__dirname, `../packages/${name}`, ...rest)
}

const DATA_DIR = getPackDir(DATA_PACK, 'src')

function clearDir (dir) {
  rimraf.sync(dir)
  mkdirp.sync(dir)
}

function renderTpl (tpl, data) {
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      tpl = tpl.replace(new RegExp(`{${key}}`, 'g'), data[key])
    }
  }
  return tpl
}

async function generate () {
  clearDir(SVG_DIR)
  clearDir(path.join(DATA_DIR, 'icons'))

  ICON_PACKS.forEach((pack) => {
    const iconsDir = path.join(getPackDir(pack), 'src/icons')
    clearDir(iconsDir)
  })

  return Promise.all(
    (await getSVGFiles()).map(async ({ slug, content }) => {
      const file = `${slug}.svg`
      const { el, content: svg, width, height } = await normalizeSVG(content, file)

      fs.writeFileSync(path.join(SVG_DIR, file), svg, 'utf8')

      const name = camelCase(slug)
      const Name = upperFirst(name)

      const { width: w, height: h, ...attributes } = el.attributes

      const iconCode = stringifyObject(
        {
          name: `Icon${Name}`,
          content: el.children.map((child) => stringify(child)).join(''),
          attributes,
          width: Number(width),
          height: Number(height)
        },
        {
          indent: '  '
        }
      )

      const tplData = {
        name,
        Name,
        icon: iconCode
      }

      const dataModuleCode = renderTpl(DATA_TPL, tplData)
      const iconModuleCode = renderTpl(ICON_TPL, tplData)

      fs.writeFileSync(
        path.join(DATA_DIR, `icons/${Name}.js`),
        dataModuleCode,
        'utf8'
      )

      ICON_PACKS.forEach((pack) => {
        const iconsDir = path.join(getPackDir(pack), 'src/icons')
        fs.writeFileSync(
          path.join(iconsDir, `${Name}.js`),
          iconModuleCode,
          'utf8'
        )
      })

      return { slug, name, Name, file }
    })
  ).then((icons) => {
    const dataIndex = icons
      .map((data) => renderTpl(DATA_EXPORT_TPL, data))
      .join('')

    fs.writeFileSync(path.join(DATA_DIR, 'index.js'), dataIndex, 'utf8')

    const iconIndex =
      icons.map((data) => renderTpl(ICON_EXPORT_TPL, data)).join('') +
      'export { createIcon, SharedResources } from \'./common\'\n'

    ICON_PACKS.concat(DATA_PACK).forEach((pack) => {
      const packDir = getPackDir(pack)
      if (pack !== DATA_PACK) {
        fs.writeFileSync(path.join(packDir, 'src/index.js'), iconIndex, 'utf8')
      }

      const [indexTpl, exportTpl] = TYPINGS_TPL_MAP[pack]
      const typeExports = icons
        .map((data) => renderTpl(exportTpl, data))
        .join('')
      const typeIndex = renderTpl(indexTpl, { exports: typeExports })
      fs.writeFileSync(path.join(packDir, 'src/index.d.ts'), typeIndex, 'utf8')

      const cols = 5
      const prefix = pack === DATA_PACK ? 'data' : 'Icon'
      const iconTable =
        '<table><tbody>' +
        Array.from({ length: Math.ceil(icons.length / cols) })
          .map((_, i) => {
            return Array.from({ length: cols })
              .map((_, j) => icons[i * cols + j])
              .map(
                (icon) =>
                  `<td align="center">${
                    icon
                      ? `<img src="https://raw.githubusercontent.com/ecomfe/dls-icons/master/svg/${icon.file}" height="24"/><br/><sub>${prefix}${icon.Name}</sub>`
                      : ''
                  }</td>`
              )
              .join('')
          })
          .map((row) => `<tr>${row}</tr>`)
          .join('') +
        '</tbody></table>'

      const readmeFiles = ['README.md', 'README.zh-Hans.md']

      readmeFiles.forEach(readme => {
        const file = path.join(packDir, readme)
        const content = fs.readFileSync(file, 'utf8')

        fs.writeFileSync(
          file,
          commentMark(content, {
            icons: iconTable
          }),
          'utf8'
        )
      })
    })

    console.log(`Normalized ${icons.length} icons.`)
  })
}

function sortFileData (f1, f2) {
  return f1.slug > f2.slug ? 1 : -1
}

async function getSVGFiles () {
  if (ENDPOINT) {
    const { data } = JSON.parse(await fetch(ENDPOINT).then((res) => res.text()))

    clearDir(RAW_DIR)

    data.forEach(({ label, svg }) => {
      fs.writeFileSync(
        path.join(RAW_DIR, label.replace(/_/g, '-') + '.svg'),
        svg,
        'utf8'
      )
    })

    return data
      .map(({ label, svg }) => ({
        slug: label.replace(/_/g, '-'),
        content: svg
      }))
      .sort(sortFileData)
  } else {
    return fs
      .readdirSync(RAW_DIR)
      .filter((file) => ICON_PATTERN.test(file))
      .map((file) => {
        const slug = file.replace(ICON_PATTERN, (_, $1) => $1)
        const content = fs.readFileSync(path.resolve(RAW_DIR, file), 'utf8')
        return {
          slug,
          content
        }
      })
      .sort(sortFileData)
  }
}

async function normalizeSVG (content, file) {
  const shasum = createHash('sha1')
  shasum.update(content)
  const id = shasum.digest('hex').substring(0, 5)

  const { error, data } = await optimize(content, getSVGOConfig({ id }))
  if (error) {
    console.error(file, error)
    return
  }

  const el = await parse(data)
  console.log(`Normalizing ${file}...`)
  const { attributes } = el
  let { width, height, viewBox } = attributes

  if (!viewBox && !(width && height)) {
    console.error(file, 'doesn\'t contain a valid size declaration.')
    console.error(width, height, viewBox)
  } else if (viewBox) {
    // has viewBox, override width/height
    ;[, width, height] = (viewBox.match(/0 0 (\d+) (\d+)/) || []).map((size) =>
      parseInt(size, 10)
    )
  } else {
    // no viewBox, use width/height
    attributes.viewBox = `0 0 ${width} ${height}`
  }

  walkElement(el, {
    enter (node) {
      const { attributes } = node

      delete attributes.class

      const ctxFill = (getContextAttr(node, 'fill') || '').toLowerCase()
      const ctxStroke = (getContextAttr(node, 'stroke') || '').toLowerCase()
      const attrFill = (attributes.fill || '').toLowerCase()
      const attrStroke = (attributes.stroke || '').toLowerCase()

      if (attrFill) {
        if (!ctxFill) {
          if (attrFill !== 'none') {
            attributes.fill = 'currentColor'
            console.log(`  fill: ${attrFill} → currentColor`)
          }
        } else {
          if (attrFill === ctxFill) {
            delete attributes.fill
            console.log(`  fill: ${attrFill} → / (same as context)`)
          } else if (attrFill !== 'none') {
            attributes.fill = 'currentColor'
            console.log(
              `  fill: ${attrFill} → currentColor (different from context)`
            )
          }
        }
      }

      if (attrStroke) {
        if (!ctxStroke) {
          if (attrStroke !== 'none') {
            attributes.stroke = 'currentColor'
            console.log(`  stroke: ${attrStroke} → currentColor`)
          } else {
            delete attributes.stroke
            console.log(`  stroke: ${attrStroke} → / (same as default)`)
          }
        } else {
          if (attrStroke && attrStroke === ctxStroke) {
            delete attributes.stroke
            console.log(`  stroke: ${attrStroke} → / (same as context)`)
          } else if (attrStroke !== 'none') {
            attributes.stroke = 'currentColor'
            console.log(
              `  stroke: ${attrStroke} → currentColor (different from context)`
            )
          }
        }
      }
    }
  })

  return {
    el,
    content: stringify(el),
    width,
    height
  }
}

function walkElement (el, { enter, leave }) {
  if (typeof enter === 'function') {
    enter(el)
  }
  if (el.children && el.children.length) {
    el.children.forEach((child) => {
      child.parentNode = el
      walkElement(child, { enter, leave })
      delete child.parentNode
    })
  }
  if (typeof leave === 'function') {
    leave(el)
  }
}

function getContextAttr (el, attr) {
  let node = el.parentNode
  while (node) {
    if (node.attributes && node.attributes[attr]) {
      return node.attributes[attr]
    }

    node = node.parentNode
  }
  return null
}

async function main () {
  await generate()
}

main()
