import './globals.css'
import { AuthProvider } from '../app/provider/AuthProvider'
import { AppTransitionProvider } from '../app/provider/AppTransitionProvider'
import { MaintenanceProvider } from './context/MaintenanceContext'
import { WebsiteSettingsProvider } from './context/WebsiteSettingsContext'
import { getWebsiteSettingsServer } from './lib/serverWebsiteSettings'

export const metadata = {
  title: 'Growtech Central',
  description: 'Toko Digital Terpercaya',
}

export default async function RootLayout({ children }) {
  const initialSettings = await getWebsiteSettingsServer()

  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body>
        <AppTransitionProvider>
          <WebsiteSettingsProvider initialSettings={initialSettings}>
            <MaintenanceProvider>
              <AuthProvider>{children}</AuthProvider>
            </MaintenanceProvider>
          </WebsiteSettingsProvider>
        </AppTransitionProvider>
      </body>
    </html>
  )
}