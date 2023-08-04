import type {
  ComponentPropsWithoutRef,
  ForwardRefExoticComponent,
  RefAttributes,
  JSX
} from 'react'

interface IconProps extends ComponentPropsWithoutRef<'svg'> {
  title?: string
  spin?: boolean
  active?: boolean
}

type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

export declare function SharedResources(props: {}): JSX.Element
{exports}
