export function notifyFavoriteChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent("favorite:changed", { detail }))
}
