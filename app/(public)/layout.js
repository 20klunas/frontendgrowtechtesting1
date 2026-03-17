import NavbarPublic from "../../app/components/Navbar";
import Footer from "../../app/components/Footer";
import { WebsiteSettingsProvider } from "../context/WebsiteSettingsContext";
export default function PublicLayout({ children }) {
  return (
    <WebsiteSettingsProvider>

      <NavbarPublic />
      {children}
      <Footer />
    </WebsiteSettingsProvider>
  );
}
