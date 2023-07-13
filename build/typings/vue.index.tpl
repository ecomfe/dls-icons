type DefineComponent<T> = new () => { $props: T }

type IconProps = {
  title?: string
  spin?: boolean
  active?: boolean
}

export const SharedResources: DefineComponent<{}>
{exports}
