import { Suspense } from "react"
import ReferralClient from "./ReferralClient"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Loading...</div>}>
      <ReferralClient />
    </Suspense>
  )
}