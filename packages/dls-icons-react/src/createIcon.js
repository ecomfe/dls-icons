/**
 * @file SVG icon factory
 * @author zhanglili, guyiling
 */
import '@/icon.css'
import { escapeHTML } from '@/util'

const baseClassName = 'dls-icon'

export default function createIcon ({ name, content, attributes }) {
  const Icon = ({ className, title, spin, ...props }) => {
    const iconClasses = [baseClassName, className]

    if (spin) {
      iconClasses.push(`${baseClassName}-spin`)
    }

    const iconClassName = iconClasses.join(' ')
    const { tabIndex } = props
    const markup = {
      __html: (title ? `<title>${escapeHTML(title)}</title>` : '') + content
    }

    return (
      <svg
        {...attributes}
        className={iconClassName}
        focusable={tabIndex !== '0' ? false : null}
        dangerouslySetInnerHTML={markup}
        {...props}
      />
    )
  }
  Icon.displayName = name

  return Icon
}
