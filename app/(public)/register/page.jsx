import { Suspense } from "react"
import RegisterClient from "./RegisterClient"

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 pt-16 text-white">
          Loading...
        </main>
      }
    >
      <RegisterClient />
    </Suspense>
  )
}
