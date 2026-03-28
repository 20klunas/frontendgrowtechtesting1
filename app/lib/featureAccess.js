export const DEFAULT_MAINTENANCE_STATE = {
  publicMaintenance: false,
  publicMaintenanceMessage: "",
  catalogDisabled: false,
  catalogMessage: "",
  checkoutDisabled: false,
  checkoutMessage: "",
  topupDisabled: false,
  topupMessage: "",
  userAuthDisabled: false,
  userAuthMessage: "",
}

function normalizeFeatureNode(node, fallbackMessage) {
  const enabled = typeof node?.enabled === "boolean" ? node.enabled : true
  const message = typeof node?.message === "string" ? node.message : fallbackMessage

  return {
    disabled: !enabled,
    message: !enabled ? message : "",
  }
}

export function normalizeFeatureAccess(payload = {}) {
  const publicAccess = normalizeFeatureNode(
    payload?.public_access,
    "Halaman publik sedang maintenance."
  )
  const catalog = normalizeFeatureNode(
    payload?.catalog_access,
    "Katalog sedang maintenance."
  )
  const checkout = normalizeFeatureNode(
    payload?.checkout_access,
    "Checkout sedang maintenance."
  )
  const topup = normalizeFeatureNode(
    payload?.topup_access,
    "Top up sedang maintenance."
  )
  const userAuth = normalizeFeatureNode(
    payload?.user_auth_access,
    "Login dan registrasi sedang maintenance."
  )

  return {
    publicMaintenance: publicAccess.disabled,
    publicMaintenanceMessage: publicAccess.message,
    catalogDisabled: catalog.disabled,
    catalogMessage: catalog.message,
    checkoutDisabled: checkout.disabled,
    checkoutMessage: checkout.message,
    topupDisabled: topup.disabled,
    topupMessage: topup.message,
    userAuthDisabled: userAuth.disabled,
    userAuthMessage: userAuth.message,
  }
}
