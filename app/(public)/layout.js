import NavbarPublic from "../../app/components/Navbar";
import Footer from "../../app/components/Footer";
import { getWebsiteSettings } from "../lib/api/website";

export default async function PublicLayout({ children }) {

  const { brand, footer } = await getWebsiteSettings();

  return (
    <>
      <NavbarPublic brand={brand} />

      {children}

      <Footer brand={brand} footer={footer} />
    </>
  );
}