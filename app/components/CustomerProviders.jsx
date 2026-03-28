"use client";

import { useEffect, useRef } from "react";
import { CustomerNavbarProvider } from "../context/CustomerNavbarContext";
import { useAuth } from "../hooks/useAuth";
import { AuthProvider } from "../provider/AuthProvider";
// function CustomerAuthHydrator({ initialShellData }) {
//   const { actualUser, setUser } = useAuth();
//   const hasHydrated = useRef(false);

//   useEffect(() => {
//     if (hasHydrated.current) return;

//     const bootstrapUser = initialShellData?.auth?.user || null;

//     if (!bootstrapUser) return;

//     setUser(bootstrapUser, { display: true });
//     hasHydrated.current = true;
//   }, [initialShellData, setUser]);

//   return null;
// }

// export default function CustomerProviders({ children, initialShellData = null }) {
//   return (
//     <CustomerNavbarProvider initialShellData={initialShellData}>
//       <CustomerAuthHydrator initialShellData={initialShellData} />
//       {children}
//     </CustomerNavbarProvider>
//   );
// }

export default function CustomerProviders({ children, initialShellData = null }) {
  return (
    <AuthProvider initialUser={initialShellData?.auth?.user}>
      <CustomerNavbarProvider initialShellData={initialShellData}>
        {children}
      </CustomerNavbarProvider>
    </AuthProvider>
  );
}