/**
 * @file SVG icon factory
 * @author zhanglili, guyiling
 */
import { escapeHTML } from '@/util'
import { markup, attributes } from '@/shared'
import '@/icon.less'

const baseClassName = 'dls-icon'

export function createIcon ({ name, content, width, height, attributes }) {
  return {
    functional: true,
    name,
    props: {
      spin: Boolean,
      active: {
        type: Boolean,
        default: undefined
      }
    },
    render (h, { props: { spin, active } = {}, data = {} }) {
      const {
        staticClass,
        class: dynamicClass,
        attrs: { title, ...attrs } = {},
        ...rest
      } = data
      const { tabindex } = attrs

      const iconClasses = [baseClassName, staticClass, dynamicClass]

      if (spin) {
        iconClasses.push(`${baseClassName}-spin`)
      }

      if (typeof active !== 'undefined') {
        iconClasses.push(`${baseClassName}-${active ? 'active' : 'inactive'}`)
      }

      return h('svg', {
        class: iconClasses,
        attrs: {
          ...attributes,
          width,
          height,
          focusable: tabindex !== '0' ? 'false' : null,
          ...attrs
        },
        domProps: {
          innerHTML:
            (title ? `<title>${escapeHTML(title)}</title>` : '') + content
        },
        ...rest
      })
    }
  }
}

export const SharedResources = {
  functional: true,
  name: 'SharedResources',
  render (h, { data = {} }) {
    const { staticClass, class: dynamicClass, attrs, ...rest } = data

    const iconClasses = [baseClassName, `${baseClassName}-shared`, staticClass, dynamicClass]

    return h('svg', {
      class: iconClasses,
      attrs: {
        ...attributes,
        ...attrs,
        focusable: 'false'
      },
      domProps: {
        innerHTML: markup
      },
      ...rest
    })
  }
}
