import NavbarCustomer from "../components/NavbarCustomer";
import Footer from "../components/FooterCustomer";
import CustomerProviders from "../components/CustomerProviders";
import { getWebsiteBrandServer } from "../lib/serverWebsiteSettings";

export default async function CustomerLayout({ children }) {
  const brand = await getWebsiteBrandServer();

  return (
    <CustomerProviders initialBrand={brand}>
      <div className="min-h-screen flex flex-col">
        <NavbarCustomer brand={brand} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CustomerProviders>
  );
}