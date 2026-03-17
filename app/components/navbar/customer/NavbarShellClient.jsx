'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'

export default function NavbarShellClient({ children }) {
  const [scrolled, setScrolled] = useState(false)
  const rafRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return

      rafRef.current = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 30)
        rafRef.current = null
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b border-purple-800/40 bg-gradient-to-r from-[#14002a] to-[#2b044d] transition-all duration-300',
        scrolled ? 'py-2 shadow-xl' : 'py-4'
      )}
    >
      {children}
    </nav>
  )
}