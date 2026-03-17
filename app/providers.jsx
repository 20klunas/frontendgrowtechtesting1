"use client"

import { SWRConfig } from "swr"

export default function Providers({ children }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 60000,
      }}
    >
      {children}
    </SWRConfig>
  )
}