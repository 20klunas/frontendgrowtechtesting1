import { Suspense } from "react";
import MaintenanceClient from "./MaintenanceClient";

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <MaintenanceClient />
    </Suspense>
  );
}