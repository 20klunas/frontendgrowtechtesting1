"use client";

import { Suspense } from "react";
import CustomerProductContent from "./CustomerProductContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
      <CustomerProductContent />
    </Suspense>
  );
}