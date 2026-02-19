"use client";

import { Suspense } from "react";
import CustomerProductContent from "./CustomerProductContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <CustomerProductContent />
    </Suspense>
  );
}
