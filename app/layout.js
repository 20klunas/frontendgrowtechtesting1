import "./globals.css"
import { AuthProvider } from "./provider/AuthProvider"
import { AppTransitionProvider } from "./provider/AppTransitionProvider"
import { MaintenanceProvider } from "./context/MaintenanceContext"
import { WebsiteSettingsProvider } from "./context/WebsiteSettingsContext"
import { getWebsiteSettingsServer } from "./lib/serverWebsiteSettings"
import { getServerFeatureAccess } from "./lib/serverFeatureAccess"

export const metadata = {
  title: "Growtech Central",
  description: "Toko Digital Terpercaya",
}

export default async function RootLayout({ children }) {
  const [initialSettings, initialMaintenanceState] = await Promise.all([
    getWebsiteSettingsServer(),
    getServerFeatureAccess(),
  ])

  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body>
        <AppTransitionProvider>
          <WebsiteSettingsProvider initialSettings={initialSettings}>
            <MaintenanceProvider initialState={initialMaintenanceState}>
              <AuthProvider>{children}</AuthProvider>
            </MaintenanceProvider>
          </WebsiteSettingsProvider>
        </AppTransitionProvider>
      </body>
    </html>
  )
}
