export function notifyFavoriteChanged() {
  window.dispatchEvent(new Event("favorite:changed"))
}