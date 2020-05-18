/**
 * @file SVG图标工厂函数
 * @author zhanglili
 */

import { memoize, merge } from './utils'
import './icon.css'

const computeScaleStyle = memoize((n) => ({
  display: 'inline-block',
  width: `${n}em`,
  height: `${n}em`,
}))

export default svg => {
  const baseClassName = 'dls-icon'
  const IconComponent = svg

  return ({ className, scale, style, ...props }) => {
    const iconClassName = className
      ? baseClassName + ' ' + className
      : baseClassName
    const scaleStyle = scale ? computeScaleStyle(scale) : null
    const iconStyle = merge(scaleStyle, style)

    return (
      <IconComponent {...props} style={iconStyle} className={iconClassName} />
    )
  }
}
