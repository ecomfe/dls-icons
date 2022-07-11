/**
 * @file SVG icon factory
 * @author zhanglili, guyiling
 */
import '@/icon.css'
import { escapeHTML } from '@/util'

const baseClassName = 'dls-icon'

export default function createIcon ({ name, content, attributes }) {
  return {
    functional: true,
    name,
    props: {
      spin: Boolean
    },
    render (h, { props = {}, data = {} }) {
      const {
        staticClass,
        class: dynamicClass,
        attrs: { title, ...attrs } = {},
        ...rest
      } = data
      const { tabindex } = attrs

      const iconClasses = [baseClassName, staticClass, dynamicClass]

      if (props.spin) {
        iconClasses.push(`${baseClassName}-spin`)
      }

      return h('svg', {
        class: iconClasses,
        attrs: {
          ...attributes,
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
