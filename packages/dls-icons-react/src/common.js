/**
 * @file SVG icon factory
 * @author zhanglili, guyiling
 */
import { forwardRef } from 'react'
import { escapeHTML } from '@/util'
import { markup, attributes } from '@/shared'
import '@/icon.less'

const baseClassName = 'dls-icon'

export function createIcon ({ name, content, width, height, attributes }) {
  const Icon = forwardRef(({ className, title, spin, active, ...props }, ref) => {
    const iconClasses = [baseClassName, className]

    if (spin) {
      iconClasses.push(`${baseClassName}-spin`)
    }

    if (typeof active !== 'undefined') {
      iconClasses.push(`${baseClassName}-${active ? 'active' : 'inactive'}`)
    }

    const iconClassName = iconClasses.join(' ')
    const { tabIndex } = props
    const html = {
      __html: (title ? `<title>${escapeHTML(title)}</title>` : '') + content
    }

    return (
      <svg
        {...attributes}
        width={width}
        height={height}
        className={iconClassName}
        focusable={tabIndex !== '0' ? false : null}
        dangerouslySetInnerHTML={html}
        ref={ref}
        {...props}
      />
    )
  })

  Icon.displayName = name

  return Icon
}

export function SharedResources () {
  const html = {
    __html: markup
  }

  return (
    <svg
      {...attributes}
      className={`${baseClassName}-shared`}
      dangerouslySetInnerHTML={html}
      focusable="false"
    />
  )
}
SharedResources.displayName = 'SharedResources'
