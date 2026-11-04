import type {
  ComponentPropsWithoutRef,
  ForwardRefExoticComponent,
  ReactElement,
  RefAttributes
} from 'react'
import type { IconData } from 'dls-icons-data'

interface IconProps extends ComponentPropsWithoutRef<'svg'> {
  title?: string
  spin?: boolean
  active?: boolean
}

type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

export declare function createIcon(data: IconData): Icon
export declare function SharedResources(props: {}): ReactElement
{exports}
