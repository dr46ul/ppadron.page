import type { NuxtLinkProps } from '#app'

export interface CustomLink extends NuxtLinkProps {
  label: string
}

export interface MenuSection {
  id?: string
  heading?: string
  items?: CustomLink[]
}
