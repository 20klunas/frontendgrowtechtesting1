import { Suspense } from "react"
import MaintenanceClient from "./MaintenanceClient"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <MaintenanceClient />
    </Suspense>
  )
}