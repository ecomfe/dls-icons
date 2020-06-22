/**
 * @file SVG icon factory
 * @author zhanglili, guyiling
 */
import '@/icon.css'
import { escapeHTML } from '@/util'

const baseClassName = 'dls-icon'

export default function createIcon({ content, width, height }) {
  return {
    functional: true,
    render(h, { data = {} }) {
      const {
        staticClass,
        class: dynamicClass,
        style,
        attrs: { title, ...attrs } = {},
        on,
      } = data
      const { tabindex } = attrs

      return h('svg', {
        class: [baseClassName, staticClass, dynamicClass],
        style,
        attrs: {
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          focusable: tabindex !== '0' ? 'false' : null,
          ...attrs,
        },
        on,
        domProps: {
          innerHTML:
            (title ? `<title>${escapeHTML(title)}</title>` : '') + content,
        },
      })
    },
  }
}
