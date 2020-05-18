import fs from 'fs'
import { camelCase, upperFirst } from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'
import rimraf from 'rimraf'

let icons = []
const SVG_DIR = path.resolve(__dirname, '../../../svg')
const SRC_DIR = path.resolve(__dirname, '../src')
const ICON_DIR = path.join(SRC_DIR, 'icons')
const ENTRY_PATH = path.join(SRC_DIR, 'index.js')
const README_PATH = path.resolve(__dirname, '../README.md')
const ICON_PATTERN = /^(.+)\.svg$/
const MODULE_TPL = fs.readFileSync(
  path.resolve(__dirname, 'component.tpl'),
  'utf8'
)
const EXPORT_TPL = fs.readFileSync(
  path.resolve(__dirname, 'export.tpl'),
  'utf8'
)

const README_TPL = fs.readFileSync(
  path.resolve(__dirname, 'readme.tpl'),
  'utf8'
)

rimraf.sync(ICON_DIR)
rimraf.sync(ENTRY_PATH)
mkdirp.sync(ICON_DIR)

Promise.all(
  fs.readdirSync(SVG_DIR).map(async (file) => {
    let [match, slug] = file.match(ICON_PATTERN) || []
    if (!match) {
      return
    }

    let name = upperFirst(camelCase(slug))
    let code = MODULE_TPL.replace(/\{slug\}/g, slug).replace(/\{name\}/g, name)
    fs.writeFileSync(path.join(ICON_DIR, `${name}.js`), code, 'utf8')

    icons.push({ slug, name, file })
  })
).then(() => {
  console.log(`Generated ${icons.length} icon modules.`)
  let exportFile = icons
    .map(({ slug, name }) =>
      EXPORT_TPL.replace(/\{slug\}/g, slug).replace(/\{name\}/g, name)
    )
    .join('')
  fs.writeFileSync(ENTRY_PATH, exportFile, 'utf8')

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
                  ? `<img src="../../svg/${icon.file}"/><br/><sub>${icon.name}</sub>`
                  : ''
              }</td>`
          )
          .join('')
      })
      .map((row) => `<tr>${row}</tr>`)
      .join('') +
    '</tbody></table>'
  let readme = README_TPL.replace(/{iconTable}/g, iconTable)
  fs.writeFileSync(README_PATH, readme, 'utf8')
})
