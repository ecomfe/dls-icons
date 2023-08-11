/**
 * @file SVG icon factory
 * @author guyiling
 */
import { computed, mergeProps, h } from 'vue'
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
    setup (props, ctx) {
      const iconClasses = computed(() => {
        const classes = [baseClassName]

        if (props.spin) {
          classes.push(`${baseClassName}-spin`)
        }

        if (typeof props.active !== 'undefined') {
          classes.push(
            `${baseClassName}-${props.active ? 'active' : 'inactive'}`
          )
        }

        return classes
      })

      return () =>
        h(
          'svg',
          mergeProps(
            {
              ...attributes,
              class: iconClasses.value,
              width,
              height,
              focusable: ctx.attrs.tabindex !== '0' ? 'false' : null,
              innerHTML:
                (ctx.attrs.title
                  ? `<title>${escapeHTML(ctx.attrs.title)}</title>`
                  : '') + content
            },
            ctx.attrs
          )
        )
    }
  }
}

export const SharedResources = {
  name: 'SharedResources',
  inheritAttrs: false,
  setup (_, ctx) {
    const iconClass = `${baseClassName} ${baseClassName}-shared`

    return () =>
      h(
        'svg',
        mergeProps(attributes, ctx.attrs, {
          class: iconClass,
          focusable: false,
          innerHTML: markup
        })
      )
  }
}
