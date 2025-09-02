import type { NuxtLinkProps } from '#app'

export interface Link extends NuxtLinkProps {
  label: string
}

export interface MenuSection {
  id?: string
  heading?: string
  items?: Link[]
}
