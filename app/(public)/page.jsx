import HomePageClient from "./HomePageClient"
import { getWebsiteSettings, getBanners } from "../lib/api/website"

export default async function HomePage() {

  const [brand, banners] = await Promise.all([
    getWebsiteSettings(),
    getBanners()
  ])

  return (
    <HomePageClient
      brand={brand}
      banners={banners}
    />
  )
}