import { Suspense } from "react"
import VerifyOtpClient from "./verify-otp-client"

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <VerifyOtpClient />
    </Suspense>
  )
}