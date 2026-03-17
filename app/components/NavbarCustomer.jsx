import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Heart } from 'lucide-react'

import NavbarShellClient from './navbar/customer/NavbarShellClient'
import NavbarLogo from './navbar/customer/NavbarLogo'
import NavbarMenu from './navbar/customer/NavbarMenu'

const NavbarSearchClient = dynamic(
  () => import('./navbar/customer/NavbarSearchClient'),
  {
    loading: () => (
      <div className="ml-6 hidden w-[320px] lg:block">
        <div className="h-[42px] w-full rounded-full border border-purple-300/40 bg-white/95" />
      </div>
    ),
  }
)

const NavbarCartClient = dynamic(
  () => import('./navbar/customer/NavbarCartClient'),
  {
    loading: () => (
      <div className="relative text-white">
        🛒
      </div>
    ),
  }
)

const NavbarUserMenuClient = dynamic(
  () => import('./navbar/customer/NavbarUserMenuClient'),
  {
    loading: () => (
      <div className="flex items-center gap-2">
        <div className="hidden text-right leading-tight md:block">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="mt-1 h-3 w-12 rounded bg-white/10" />
        </div>
        <div className="h-8 w-8 rounded-full bg-purple-600" />
      </div>
    ),
  }
)

export default function NavbarCustomer({ brand }) {
  return (
    <NavbarShellClient>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4">
        <NavbarLogo brand={brand} />

        <div className="flex min-w-0 flex-1 items-center justify-center gap-8">
          <NavbarMenu />
          <NavbarSearchClient />
        </div>

        <div className="relative flex items-center gap-3">
          <Link
            href="/customer/favorites"
            className="relative text-white transition hover:text-pink-400"
          >
            <Heart size={20} />
          </Link>

          <NavbarCartClient />
          <NavbarUserMenuClient />
        </div>
      </div>
    </NavbarShellClient>
  )
}