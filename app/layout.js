import "./globals.css"
import { AuthProvider } from "./provider/AuthProvider"
import { AppTransitionProvider } from "./provider/AppTransitionProvider"
import { MaintenanceProvider } from "./context/MaintenanceContext"
import { WebsiteSettingsProvider } from "./context/WebsiteSettingsContext"
import { getWebsiteSettingsServer } from "./lib/serverWebsiteSettings"
import { getServerFeatureAccess } from "./lib/serverFeatureAccess"
import { DEFAULT_MAINTENANCE_STATE } from "./lib/featureAccess"

export const metadata = {
  title: "Growtech Central",
  description: "Toko Digital Terpercaya",
}

export default async function RootLayout({ children }) {
  const [initialSettingsResult, initialMaintenanceResult] = await Promise.allSettled([
    getWebsiteSettingsServer(),
    getServerFeatureAccess(),
  ])

  const initialSettings =
    initialSettingsResult.status === "fulfilled" ? initialSettingsResult.value : {}

  const initialMaintenanceState =
    initialMaintenanceResult.status === "fulfilled"
      ? initialMaintenanceResult.value
      : DEFAULT_MAINTENANCE_STATE

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
