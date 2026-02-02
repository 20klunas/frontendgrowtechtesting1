import "./globals.css"
import { AuthProvider } from "../app/provider/AuthProvider"
import Script from "next/script"

export const metadata = {
  title: "Growtech Central",
  description: "Toko Digital Terpercaya",
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" classname="dark">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Script
            src="https://app.sandbox.midtrans.com/snap/snap.js"
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="afterInteractive"
          />
        </AuthProvider>
      </body>
    </html>
  )
}
