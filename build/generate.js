import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import svgson, { stringify } from 'svgson'
import stringifyObject from 'stringify-object'
import { camelCase, upperFirst } from 'lodash'
import Svgo from 'svgo'
const svgo = new Svgo({
  multipass: true,
  removeViewBox: false,
  floatPrecision: 3
})

const RAW_DIR = path.resolve(__dirname, '../raw')
const SVG_DIR = path.resolve(__dirname, '../svg')
const SRC_DIR = path.resolve(__dirname, '../src')
const ICON_PATTERN = /^(.+)\.svg$/
const MODULE_TPL = fs.readFileSync(
  path.resolve(__dirname, 'component.tpl'),
  'utf8'
)
const EXPORT_TPL = fs.readFileSync(
  path.resolve(__dirname, 'export.tpl'),
  'utf8'
)
const ICON_PACKS = ['dls-icons-react', 'dls-icons-vue']

function getPackDir (name) {
  return path.resolve(__dirname, `../packages/${name}`)
}

rimraf.sync(SVG_DIR)
mkdirp.sync(SVG_DIR)

ICON_PACKS.forEach(pack => {
  let iconsDir = path.join(getPackDir(pack), 'src/icons')
  rimraf.sync(iconsDir)
  mkdirp.sync(iconsDir)
})

Promise.all(
  fs.readdirSync(RAW_DIR).map(async file => {
    if (!ICON_PATTERN.test(file)) {
      return
    }

    let fileData = fs.readFileSync(path.resolve(RAW_DIR, file), 'utf8')
    let { error, data } = await svgo.optimize(fileData)
    if (error) {
      console.error(file, error)
      return
    }

    let el = await svgson(data)
    console.log(`Normalizing ${file}...`)
    let { attributes } = el
    let { width, height, viewBox } = attributes
    if (!(width && height)) {
      if (!viewBox) {
        console.error(file, `doesn't contain a valid size declaration.`)
        console.error(width, height, viewBox)
      }

      ;[, width, height] = (viewBox.match(/0 0 (\d+) (\d+)/) || []).map(size =>
        parseInt(size, 10)
      )
    }

    if (!(width && height)) {
      console.error(file, `doesn't contain a valid size declaration.`)
      console.error(width, height, viewBox)
    }

    if (!viewBox) {
      attributes.viewBox = `0 0 ${width} ${height}`
    }

    walkElement(el, {
      enter (node) {
        let { attributes } = node

        delete attributes.class

        let ctxFill = (getContextAttr(node, 'fill') || '').toLowerCase()
        let ctxStroke = (getContextAttr(node, 'stroke') || '').toLowerCase()
        let attrFill = (attributes.fill || '').toLowerCase()
        let attrStroke = (attributes.stroke || '').toLowerCase()

        if (attrFill) {
          if (!ctxFill) {
            if (attrFill !== 'none') {
              attributes.fill = 'currentColor'
              console.log(`  fill: ${attrFill} -> currentColor`)
            }
          } else {
            if (attrFill === ctxFill) {
              delete attributes.fill
              console.log(`  fill: ${attrFill} -> / (same as context)`)
            } else if (attrFill !== 'none') {
              attributes.fill = 'currentColor'
              console.log(
                `  fill: ${attrFill} -> currentColor (different from context)`
              )
            }
          }
        }

        if (attrStroke) {
          if (!ctxStroke) {
            if (attrStroke !== 'none') {
              attributes.stroke = 'currentColor'
              console.log(`  stroke: ${attrStroke} -> currentColor`)
            } else {
              delete attributes.stroke
              console.log(`  stroke: ${attrStroke} -> / (same as default)`)
            }
          } else {
            if (attrStroke && attrStroke === ctxStroke) {
              delete attributes.stroke
              console.log(`  stroke: ${attrStroke} -> / (same as context)`)
            } else if (attrStroke !== 'none') {
              attributes.stroke = 'currentColor'
              console.log(
                `  stroke: ${attrStroke} -> currentColor (different from context)`
              )
            }
          }
        }
      }
    })

    fs.writeFileSync(path.join(SVG_DIR, file), stringify(el), 'utf8')

    let slug = file.replace(ICON_PATTERN, (_, $1) => $1)
    let name = upperFirst(camelCase(slug))

    let iconCode = stringifyObject({
      content: el.children.map(child => stringify(child)).join(''),
      width: Number(width),
      height: Number(height),
    }, {
      indent: '  '
    })

    let moduleCode = MODULE_TPL
      .replace(/\{slug\}/g, slug)
      .replace(/\{name\}/g, name)
      .replace(/\{icon\}/g, iconCode)

    ICON_PACKS.forEach(pack => {
      let iconsDir = path.join(getPackDir(pack), 'src/icons')
      fs.writeFileSync(path.join(iconsDir, `${name}.js`), moduleCode, 'utf8')
    })

    return { slug, name, file }
  })
).then(icons => {
  let exportFile = icons
    .map(({ slug, name }) =>
      EXPORT_TPL.replace(/\{slug\}/g, slug).replace(/\{name\}/g, name)
    )
    .join('')

  ICON_PACKS.forEach(pack => {
    let packDir = getPackDir(pack)
    fs.writeFileSync(path.join(packDir, `src/index.js`), exportFile, 'utf8')

    let readmeFile = path.join(packDir, 'README.md')
    let readmeTpl = fs.readFileSync(path.join(packDir, 'build/readme.tpl'), 'utf8')
    let cols = 3
    let iconTable =
      '<table><tbody>' +
      Array.from({ length: Math.ceil(icons.length / cols) })
        .map((_, i) => {
          return Array.from({ length: cols })
            .map((_, j) => icons[i * cols + j])
            .map(
              (icon) =>
                `<td align="center">${
                  icon
                    ? `<img src="../../svg/${icon.file}"/><br/><sub>Icon${icon.name}</sub>`
                    : ''
                }</td>`
            )
            .join('')
        })
        .map((row) => `<tr>${row}</tr>`)
        .join('') +
      '</tbody></table>'
    let readme = readmeTpl.replace(/{iconTable}/g, iconTable)
    fs.writeFileSync(readmeFile, readme, 'utf8')

  })

  console.log(`Normalized ${icons.length} icons.`)
})

function walkElement (el, { enter, leave }) {
  if (typeof enter === 'function') {
    enter(el)
  }
  if (el.children && el.children.length) {
    el.children.forEach(child => {
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
