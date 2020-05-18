import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import svgson, { stringify } from 'svgson'
import Svgo from 'svgo'
const svgo = new Svgo({
  multipass: true,
  removeViewBox: false,
  floatPrecision: 3
})

let icons = 0
const RAW_DIR = path.resolve(__dirname, '../raw/')
const SVG_DIR = path.resolve(__dirname, '../svg/')
const ICON_PATTERN = /^(.+)\.svg$/

rimraf.sync(SVG_DIR)
mkdirp.sync(SVG_DIR)

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
    icons++
  })
).then(() => {
  console.log(`Normalized ${icons} icons.`)
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
