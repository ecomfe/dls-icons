import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import svgson, { stringify } from 'svgson'
import stringifyObject from 'stringify-object'
import { camelCase, upperFirst } from 'lodash'
import Svgo from 'svgo'
const svgo = new Svgo({
  multipass: true,
  removeViewBox: false,
  floatPrecision: 3,
})

const ENDPOINT = process.env.DLS_ICONS_API
const RAW_DIR = path.resolve(__dirname, '../raw')
const SVG_DIR = path.resolve(__dirname, '../svg')
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

function getPackDir(name) {
  return path.resolve(__dirname, `../packages/${name}`)
}

function clearDir(dir) {
  rimraf.sync(dir)
  mkdirp.sync(dir)
}

async function generate() {
  clearDir(SVG_DIR)

  ICON_PACKS.forEach((pack) => {
    let iconsDir = path.join(getPackDir(pack), 'src/icons')
    clearDir(iconsDir)
  })

  Promise.all(
    (await getSVGFiles()).map(async ({ slug, content }) => {
      let file = `${slug}.svg`
      let { el, content: svg, width, height } = await normalizeSVG(
        content,
        file
      )

      fs.writeFileSync(path.join(SVG_DIR, file), svg, 'utf8')

      let name = upperFirst(camelCase(slug))

      let iconCode = stringifyObject(
        {
          name: `icon-${slug}`,
          content: el.children.map((child) => stringify(child)).join(''),
          width: Number(width),
          height: Number(height),
        },
        {
          indent: '  ',
        }
      )

      let moduleCode = MODULE_TPL.replace(/\{slug\}/g, slug)
        .replace(/\{name\}/g, name)
        .replace(/\{icon\}/g, iconCode)

      ICON_PACKS.forEach((pack) => {
        let iconsDir = path.join(getPackDir(pack), 'src/icons')
        fs.writeFileSync(path.join(iconsDir, `${name}.js`), moduleCode, 'utf8')
      })

      return { slug, name, file }
    })
  ).then((icons) => {
    let exportFile =
      icons
        .map(({ slug, name }) =>
          EXPORT_TPL.replace(/\{slug\}/g, slug).replace(/\{name\}/g, name)
        )
        .join('') + `export createIcon from './createIcon'\n`

    ICON_PACKS.forEach((pack) => {
      let packDir = getPackDir(pack)
      fs.writeFileSync(path.join(packDir, `src/index.js`), exportFile, 'utf8')

      let readmeFile = path.join(packDir, 'README.md')
      let readmeTpl = fs.readFileSync(
        path.join(packDir, 'build/readme.tpl'),
        'utf8'
      )
      let cols = 5
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
                      ? `<img src="../../svg/${icon.file}" height="24"/><br/><sub>Icon${icon.name}</sub>`
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
}

function sortFileData(f1, f2) {
  return f1.slug > f2.slug ? 1 : -1
}

async function getSVGFiles() {
  if (ENDPOINT) {
    let { data } = JSON.parse(await fetch(ENDPOINT).then((res) => res.text()))

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
        content: svg,
      }))
      .sort(sortFileData)
  } else {
    return fs
      .readdirSync(RAW_DIR)
      .filter((file) => ICON_PATTERN.test(file))
      .map((file) => {
        let slug = file.replace(ICON_PATTERN, (_, $1) => $1)
        let content = fs.readFileSync(path.resolve(RAW_DIR, file), 'utf8')
        return {
          slug,
          content,
        }
      })
      .sort(sortFileData)
  }
}

async function normalizeSVG(content, file) {
  let { error, data } = await svgo.optimize(content)
  if (error) {
    console.error(file, error)
    return
  }

  let el = await svgson(data)
  console.log(`Normalizing ${file}...`)
  let { attributes } = el
  let { width, height, viewBox } = attributes

  if (!viewBox && !(width && height)) {
    console.error(file, `doesn't contain a valid size declaration.`)
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
    enter(node) {
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
    },
  })

  return {
    el,
    content: stringify(el),
    width,
    height,
  }
}

function walkElement(el, { enter, leave }) {
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

function getContextAttr(el, attr) {
  let node = el.parentNode
  while (node) {
    if (node.attributes && node.attributes[attr]) {
      return node.attributes[attr]
    }

    node = node.parentNode
  }
  return null
}

generate()
