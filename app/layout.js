import "./globals.css"
import { AuthProvider } from "../app/provider/AuthProvider"
import { MaintenanceProvider } from "./context/MaintenanceContext"
import { WebsiteSettingsProvider } from "./context/WebsiteSettingsContext" // ✅ TAMBAH

export const metadata = {
  title: "Growtech Central",
  description: "Toko Digital Terpercaya",
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body>

        <WebsiteSettingsProvider> {/* ✅ BUNGKUS GLOBAL */}

          <MaintenanceProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </MaintenanceProvider>

        </WebsiteSettingsProvider>

      </body>
    </html>
  )
}