import { Suspense } from "react";
import MaintenanceClient from "./MaintenanceClient";

export default function MaintenancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <MaintenanceClient />
    </Suspense>
  );
}