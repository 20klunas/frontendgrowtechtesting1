import NavbarCustomer from "../components/NavbarCustomer"
import Footer from "../components/FooterCustomer"
import CustomerProviders from "../components/CustomerProviders"
import { getServerShellBootstrap } from "../lib/serverShellBootstrap"

export const revalidate = 60

export default async function CustomerLayout({ children }) {
  const initialShellData = await getServerShellBootstrap()

  return (
    <CustomerProviders initialShellData={initialShellData}>
      <div className="min-h-screen flex flex-col bg-black text-white">
        <NavbarCustomer initialShellData={initialShellData} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CustomerProviders>
  )
}
