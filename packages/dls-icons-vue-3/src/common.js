/**
 * @file SVG icon factory
 * @author guyiling
 */
import { mergeProps, h } from 'vue'
import { escapeHTML } from '@/util'
import { markup, attributes } from '@/shared'
import '@/icon.less'

const baseClassName = 'dls-icon'

export function createIcon ({ name, content, width, height, attributes }) {
  return {
    name,
    inheritAttrs: false,
    props: {
      spin: Boolean,
      active: {
        type: Boolean,
        default: undefined
      }
    },
    setup ({ spin, active }, { attrs }) {
      const iconClasses = [baseClassName]

      if (spin) {
        iconClasses.push(`${baseClassName}-spin`)
      }

      if (typeof active !== 'undefined') {
        iconClasses.push(`${baseClassName}-${active ? 'active' : 'inactive'}`)
      }

      return () =>
        h(
          'svg',
          mergeProps(
            {
              ...attributes,
              class: iconClasses,
              width,
              height,
              focusable: attrs.tabindex !== '0' ? 'false' : null,
              innerHTML:
                (attrs.title
                  ? `<title>${escapeHTML(attrs.title)}</title>`
                  : '') + content
            },
            attrs
          )
        )
    }
  }
}

export const SharedResources = {
  name: 'SharedResources',
  inheritAttrs: false,
  setup (_, { attrs }) {
    const iconClass = `${baseClassName} ${baseClassName}-shared`

    return () =>
      h(
        'svg',
        mergeProps(attributes, attrs, {
          class: iconClass,
          focusable: false,
          innerHTML: markup
        })
      )
  }
}
