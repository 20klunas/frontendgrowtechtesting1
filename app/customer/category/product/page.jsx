"use client";

import { Suspense } from "react";
import CustomerProductContent from "./CustomerProductContent";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <CustomerProductContent />
    </Suspense>
  );
}
