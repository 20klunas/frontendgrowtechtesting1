"use client";

import NavbarCustomer from "../../app/components/NavbarCustomer";
import Footer from "../../app/components/FooterCustomer";
import { WebsiteSettingsProvider } from "../../app/context/WebsiteSettingsContext";

export default function CustomerLayout({ children }) {
  return (
    <WebsiteSettingsProvider>
      <div className="min-h-screen flex flex-col">
        <NavbarCustomer />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </WebsiteSettingsProvider>
  );
}