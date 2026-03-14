'use client'

import NavbarCustomer from '../../app/components/NavbarCustomer'
import Footer from '../../app/components/FooterCustomer'

export default function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      
      <NavbarCustomer />

      <main className="flex-1">
        {children}
      </main>

      <Footer />

    </div>
  )
}