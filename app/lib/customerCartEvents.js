export const CUSTOMER_CART_REFRESH_EVENT = 'customer-cart-refresh'

export function notifyCustomerCartChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CUSTOMER_CART_REFRESH_EVENT))
}