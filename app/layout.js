import "./globals.css"
import { AuthProvider } from "../app/provider/AuthProvider"
import Script from "next/script"
import { MaintenanceProvider } from "./context/MaintenanceContext"

export const metadata = {
  title: "Growtech Central",
  description: "Toko Digital Terpercaya",
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body>

        <MaintenanceProvider>

          <AuthProvider>
            {children}
          </AuthProvider>

        </MaintenanceProvider>
      </body>
    </html>
  )
}