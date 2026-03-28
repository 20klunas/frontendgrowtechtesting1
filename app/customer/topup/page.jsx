import { cookies } from "next/headers"
import TopUpClient from "./TopUpClient"
import {
  fetchAvailableGateways,
  fetchWalletLedger,
  fetchWalletSummary,
} from "./topupApi"

export const dynamic = "force-dynamic"

export default async function TopUpPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value ?? null

  const [gatewaysResult, walletResult, historyResult] = await Promise.allSettled([
    fetchAvailableGateways({ revalidate: 300 }),
    fetchWalletSummary(token),
    fetchWalletLedger(token),
  ])

  const initialGateways =
    gatewaysResult.status === "fulfilled" ? gatewaysResult.value : []

  const initialWallet =
    walletResult.status === "fulfilled" ? walletResult.value : null

  const initialHistory =
    historyResult.status === "fulfilled" ? historyResult.value : []

  return (
    <TopUpClient
      initialToken={token}
      initialWallet={initialWallet}
      initialHistory={initialHistory}
      initialGateways={initialGateways}
    />
  )
}
