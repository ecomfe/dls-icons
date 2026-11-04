import type { IconData } from 'dls-icons-data'

type DefineComponent<T> = new () => { $props: T }

type IconProps = {
  title?: string
  spin?: boolean
  active?: boolean
}

export declare function createIcon(data: IconData): DefineComponent<IconProps>
export declare const SharedResources: DefineComponent<{}>
{exports}
