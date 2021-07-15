/**
 * @file SVG icon factory
 * @author guyiling
 */
import '@/icon.css'
import { escapeHTML } from '@/util'
import { mergeProps, h } from 'vue'

const baseClassName = 'dls-icon'

export default function createIcon({ name, content, width, height }) {
  return {
    name,
    inheritAttrs: false,
    props: {
      spin: Boolean,
    },
    setup(props, { attrs }) {
      const iconClasses = [baseClassName]

      if (props.spin) {
        iconClasses.push(`${baseClassName}-spin`)
      }

      return () =>
        h(
          'svg',
          mergeProps(
            {
              class: iconClasses,
              width,
              height,
              viewBox: `0 0 ${width} ${height}`,
              focusable: attrs.tabindex !== '0' ? 'false' : null,
              innerHTML:
                (attrs.title
                  ? `<title>${escapeHTML(attrs.title)}</title>`
                  : '') + content,
            },
            attrs
          )
        )
    },
  }
}
